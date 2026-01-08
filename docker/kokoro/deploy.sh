#!/bin/bash
# Kokoro-82M TTS Deployment Script
# Remrin.ai Production Deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.kokoro.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[KOKORO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

show_help() {
    cat << EOF
Kokoro-82M TTS Deployment Script

Usage: $0 [command] [options]

Commands:
  start       Start Kokoro TTS services
  stop        Stop all services
  restart     Restart services
  status      Show service status
  logs        View service logs
  build       Build Docker image
  health      Check service health
  test        Run quick TTS test

Options:
  --gpu       Enable GPU support
  --prod      Production mode with Nginx
  --scale N   Scale TTS instances

Examples:
  $0 start             # Start CPU mode
  $0 start --gpu       # Start with GPU
  $0 start --prod      # Production with Nginx
  $0 logs              # View logs
  $0 test              # Generate test audio
EOF
}

check_docker() {
    command -v docker &>/dev/null || error "Docker not installed"
    docker info &>/dev/null || error "Docker daemon not running"
}

cmd_build() {
    log "Building Kokoro TTS image..."
    docker compose -f "$COMPOSE_FILE" build
    log "Build complete!"
}

cmd_start() {
    local profiles=""
    
    [[ "$GPU" == "true" ]] && profiles="$profiles --profile gpu"
    [[ "$PROD" == "true" ]] && profiles="$profiles --profile production"
    
    log "Starting Kokoro TTS services..."
    docker compose -f "$COMPOSE_FILE" $profiles up -d
    
    log "Waiting for health check..."
    sleep 10
    cmd_health || warn "Service may still be initializing"
    
    log "Services started! API: http://localhost:8000"
}

cmd_stop() {
    log "Stopping services..."
    docker compose -f "$COMPOSE_FILE" --profile gpu --profile production down
    log "Services stopped"
}

cmd_restart() {
    cmd_stop
    cmd_start
}

cmd_status() {
    docker compose -f "$COMPOSE_FILE" ps
}

cmd_logs() {
    docker compose -f "$COMPOSE_FILE" logs -f --tail 100
}

cmd_health() {
    local response
    response=$(curl -sf http://localhost:8000/health 2>/dev/null) || {
        error "Health check failed - service may not be running"
    }
    
    echo "$response" | jq . 2>/dev/null || echo "$response"
    
    if echo "$response" | grep -q '"status":"healthy"'; then
        log "Service is healthy!"
        return 0
    else
        warn "Service is degraded"
        return 1
    fi
}

cmd_test() {
    log "Generating test audio..."
    
    curl -sf -X POST http://localhost:8000/generate \
        -H "Content-Type: application/json" \
        -d '{"text": "Hello! This is a test of the Kokoro text to speech system.", "voice": "af_heart"}' \
        --output /tmp/kokoro_test.wav || error "Generation failed"
    
    log "Test audio saved to /tmp/kokoro_test.wav"
    
    command -v aplay &>/dev/null && {
        log "Playing audio..."
        aplay /tmp/kokoro_test.wav 2>/dev/null || true
    }
}

# Parse arguments
GPU="false"
PROD="false"
COMMAND="${1:-help}"
shift || true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --gpu) GPU="true" ;;
        --prod) PROD="true" ;;
        *) warn "Unknown option: $1" ;;
    esac
    shift
done

# Execute command
case "$COMMAND" in
    start)   check_docker; cmd_start ;;
    stop)    check_docker; cmd_stop ;;
    restart) check_docker; cmd_restart ;;
    status)  check_docker; cmd_status ;;
    logs)    check_docker; cmd_logs ;;
    build)   check_docker; cmd_build ;;
    health)  cmd_health ;;
    test)    cmd_test ;;
    help|*)  show_help ;;
esac
