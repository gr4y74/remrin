# Kokoro-82M TTS Server Setup Guide

Production-ready Text-to-Speech server for Remrin.ai using Kokoro-82M.

## Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
- [API Reference](#api-reference)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)

---

## Overview

The Kokoro-82M TTS server provides high-quality text-to-speech synthesis with:

- **11 built-in voices** (American & British accents)
- **FastAPI-based** REST API
- **Redis queuing** for request management
- **Rate limiting** to prevent abuse
- **Health monitoring** for orchestration
- **GPU acceleration** (optional)
- **Horizontal scaling** support

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
│                        (Nginx)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Kokoro TTS │  │  Kokoro TTS │  │  Kokoro TTS │
│  Instance 1 │  │  Instance 2 │  │  Instance N │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │      Redis      │
              │  (Rate Limit &  │
              │    Queuing)     │
              └─────────────────┘
```

---

## System Requirements

### Minimum (CPU-only)

| Resource | Requirement |
|----------|-------------|
| CPU | 4 cores |
| RAM | 8 GB |
| Disk | 10 GB (for model cache) |
| Docker | 24.0+ |
| Docker Compose | 2.20+ |

### Recommended (GPU-accelerated)

| Resource | Requirement |
|----------|-------------|
| GPU | NVIDIA RTX 3060+ (6GB VRAM) |
| CPU | 8 cores |
| RAM | 16 GB |
| Disk | 20 GB SSD |
| NVIDIA Driver | 535+ |
| CUDA | 12.0+ |

---

## Quick Start

### 1. Clone and Navigate

```bash
cd /mnt/Data68/remrin/docker
```

### 2. Build the Docker Image

```bash
docker compose -f docker-compose.kokoro.yml build
```

### 3. Start Services

```bash
# CPU-only mode
docker compose -f docker-compose.kokoro.yml up -d

# With GPU support
docker compose -f docker-compose.kokoro.yml --profile gpu up -d

# Production mode (with Nginx)
docker compose -f docker-compose.kokoro.yml --profile production up -d
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:8000/health

# List voices
curl http://localhost:8000/voices

# Generate speech
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Kokoro!", "voice": "af_heart"}' \
  --output test.wav
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KOKORO_HOST` | `0.0.0.0` | Server bind address |
| `KOKORO_PORT` | `8000` | Server port |
| `KOKORO_WORKERS` | `1` | Uvicorn workers |
| `KOKORO_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `KOKORO_RATE_LIMIT_REQUESTS` | `60` | Requests per window |
| `KOKORO_RATE_LIMIT_WINDOW` | `60` | Rate limit window (seconds) |
| `KOKORO_DEFAULT_VOICE` | `af_heart` | Default voice ID |
| `KOKORO_MAX_TEXT_LENGTH` | `5000` | Max characters per request |
| `KOKORO_SAMPLE_RATE` | `24000` | Audio sample rate (Hz) |
| `KOKORO_USE_GPU` | `false` | Enable GPU acceleration |
| `KOKORO_MODEL_CACHE_DIR` | `/app/model_cache` | Model cache directory |

### Resource Limits

Default Docker Compose limits:

```yaml
# CPU-only instance
limits:
  cpus: "4.0"
  memory: 8G

# GPU instance
limits:
  memory: 16G
reservations:
  devices:
    - driver: nvidia
      count: 1
```

---

## Deployment Options

### Option 1: Single Instance (Development)

```bash
docker compose -f docker-compose.kokoro.yml up kokoro-tts redis
```

### Option 2: GPU-Accelerated

```bash
# Ensure NVIDIA Container Toolkit is installed
docker compose -f docker-compose.kokoro.yml --profile gpu up -d
```

### Option 3: Production with Load Balancing

1. Create nginx configuration:

```bash
mkdir -p docker/kokoro
cat > docker/kokoro/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream kokoro {
        least_conn;
        server kokoro-tts:8000;
        # Add more instances for horizontal scaling
        # server kokoro-tts-2:8000;
        # server kokoro-tts-3:8000;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://kokoro;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 60s;
            proxy_read_timeout 120s;
        }

        location /health {
            proxy_pass http://kokoro;
            proxy_connect_timeout 5s;
            proxy_read_timeout 5s;
        }
    }
}
EOF
```

2. Deploy with Nginx:

```bash
docker compose -f docker-compose.kokoro.yml --profile production up -d
```

### Option 4: Kubernetes Deployment

```yaml
# kokoro-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kokoro-tts
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kokoro-tts
  template:
    metadata:
      labels:
        app: kokoro-tts
    spec:
      containers:
        - name: kokoro
          image: remrin/kokoro-tts:latest
          ports:
            - containerPort: 8000
          env:
            - name: KOKORO_REDIS_URL
              value: "redis://redis-service:6379"
          resources:
            limits:
              cpu: "4"
              memory: "8Gi"
            requests:
              cpu: "2"
              memory: "4Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 120
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 60
            periodSeconds: 10
```

---

## API Reference

### POST /generate

Generate speech from text.

**Request:**

```json
{
  "text": "Hello, world!",
  "voice": "af_heart",
  "speed": 1.0,
  "format": "wav"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | string | required | Text to synthesize (1-5000 chars) |
| `voice` | string | `af_heart` | Voice ID |
| `speed` | float | `1.0` | Speed multiplier (0.5-2.0) |
| `format` | string | `wav` | Output format (wav, mp3, ogg) |

**Response:** Audio file with headers:

- `X-Request-ID`: Unique request identifier
- `X-Duration-MS`: Audio duration in milliseconds
- `X-Processing-Time-MS`: Server processing time

### GET /voices

List available voices.

**Response:**

```json
{
  "voices": [
    {
      "id": "af_heart",
      "name": "Heart",
      "gender": "female",
      "language": "en",
      "accent": "American",
      "description": "Warm, friendly female voice"
    }
  ],
  "default_voice": "af_heart"
}
```

### GET /health

Health check for orchestration.

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600.5,
  "model_loaded": true,
  "redis_connected": true,
  "queue_size": 0,
  "gpu_available": false
}
```

---

## Monitoring

### Logs

```bash
# View logs
docker compose -f docker-compose.kokoro.yml logs -f kokoro-tts

# View last 100 lines
docker compose -f docker-compose.kokoro.yml logs --tail 100 kokoro-tts
```

### Metrics

The server outputs structured JSON logs compatible with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana Loki**
- **Datadog**

### Health Monitoring

```bash
# Continuous health check
watch -n 5 'curl -s http://localhost:8000/health | jq'
```

---

## Troubleshooting

### Model Loading Issues

**Symptom:** Server starts but `/generate` returns 500 errors.

**Solution:**

```bash
# Check model download
docker exec remrin-kokoro-tts ls -la /app/model_cache

# Force re-download
docker compose -f docker-compose.kokoro.yml down -v
docker compose -f docker-compose.kokoro.yml up -d
```

### Out of Memory

**Symptom:** Container killed or restarts frequently.

**Solution:**

1. Increase memory limits in `docker-compose.kokoro.yml`
2. Use GPU mode for large requests
3. Reduce concurrent requests via rate limiting

### Redis Connection Failures

**Symptom:** Rate limiting not working, queue errors.

**Solution:**

```bash
# Check Redis health
docker exec remrin-kokoro-redis redis-cli ping

# Restart Redis
docker compose -f docker-compose.kokoro.yml restart redis
```

### Slow Generation

**Symptom:** Generation takes > 10 seconds.

**Solutions:**

1. Enable GPU acceleration
2. Reduce `KOKORO_MAX_TEXT_LENGTH`
3. Scale horizontally with multiple instances

### GPU Not Detected

**Symptom:** `gpu_available: false` in health check.

**Solution:**

```bash
# Verify NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# If not installed
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

---

## Performance Tuning

### CPU Optimization

```yaml
environment:
  # Use all available cores
  KOKORO_WORKERS: "4"
  # Increase for batch processing
  KOKORO_QUEUE_MAX_SIZE: "200"
```

### GPU Optimization

```yaml
environment:
  KOKORO_USE_GPU: "true"
  # Enable TensorFloat-32 for faster inference
  NVIDIA_TF32_OVERRIDE: "1"
```

### Memory Optimization

```yaml
environment:
  # Reduce for lower memory usage
  KOKORO_MAX_TEXT_LENGTH: "2000"
deploy:
  resources:
    limits:
      memory: 12G
```

### Network Optimization

For high-throughput deployments:

```yaml
# In nginx.conf
upstream kokoro {
    least_conn;
    keepalive 32;
    server kokoro-tts-1:8000 weight=5;
    server kokoro-tts-2:8000 weight=5;
    server kokoro-tts-3:8000 weight=5;
}
```

---

## Integration with Remrin.ai

### Next.js API Route

```typescript
// app/api/tts/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

const KOKORO_URL = process.env.KOKORO_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const { text, voice, speed } = await req.json();

  const response = await fetch(`${KOKORO_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, speed }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'TTS generation failed' },
      { status: response.status }
    );
  }

  const audioBuffer = await response.arrayBuffer();
  
  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/wav',
      'X-Duration-MS': response.headers.get('X-Duration-MS') || '0',
    },
  });
}
```

### Environment Variables

Add to `.env.local`:

```env
KOKORO_URL=http://localhost:8000
```

---

## Support

For issues and feature requests, please open an issue in the Remrin.ai repository.
