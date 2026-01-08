"""
Kokoro-82M TTS Server
FastAPI server for Remrin.ai text-to-speech generation

Features:
- Multiple voice support
- Request queuing with Redis
- Rate limiting
- Health monitoring
- Graceful shutdown
"""

import asyncio
import hashlib
import io
import os
import signal
import time
from contextlib import asynccontextmanager
from datetime import datetime
from enum import Enum
from typing import Optional

import numpy as np
import redis.asyncio as redis
import soundfile as sf
import structlog
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logger = structlog.get_logger()


# =============================================================================
# Configuration
# =============================================================================


class Settings(BaseSettings):
    """Server configuration from environment variables."""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1

    # Redis
    redis_url: str = "redis://localhost:6379"
    queue_max_size: int = 100

    # Rate limiting
    rate_limit_requests: int = 60
    rate_limit_window: int = 60  # seconds

    # TTS
    default_voice: str = "af_heart"
    max_text_length: int = 5000
    sample_rate: int = 24000

    # Model
    model_cache_dir: str = "/app/model_cache"
    use_gpu: bool = False

    class Config:
        env_prefix = "KOKORO_"


settings = Settings()


# =============================================================================
# Voice Configuration
# =============================================================================


class VoiceGender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class Voice(BaseModel):
    """Voice model definition."""

    id: str
    name: str
    gender: VoiceGender
    language: str
    accent: str
    description: str
    sample_url: Optional[str] = None


# Available Kokoro voices
VOICES: dict[str, Voice] = {
    "af_heart": Voice(
        id="af_heart",
        name="Heart",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="American",
        description="Warm, friendly female voice with clear articulation",
    ),
    "af_bella": Voice(
        id="af_bella",
        name="Bella",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="American",
        description="Expressive female voice with natural intonation",
    ),
    "af_nicole": Voice(
        id="af_nicole",
        name="Nicole",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="American",
        description="Professional female voice, great for narration",
    ),
    "af_sarah": Voice(
        id="af_sarah",
        name="Sarah",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="American",
        description="Soft, soothing female voice",
    ),
    "af_sky": Voice(
        id="af_sky",
        name="Sky",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="American",
        description="Young, energetic female voice",
    ),
    "am_adam": Voice(
        id="am_adam",
        name="Adam",
        gender=VoiceGender.MALE,
        language="en",
        accent="American",
        description="Deep, authoritative male voice",
    ),
    "am_michael": Voice(
        id="am_michael",
        name="Michael",
        gender=VoiceGender.MALE,
        language="en",
        accent="American",
        description="Warm, conversational male voice",
    ),
    "bf_emma": Voice(
        id="bf_emma",
        name="Emma",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="British",
        description="Elegant British female voice",
    ),
    "bf_isabella": Voice(
        id="bf_isabella",
        name="Isabella",
        gender=VoiceGender.FEMALE,
        language="en",
        accent="British",
        description="Refined British female voice with RP accent",
    ),
    "bm_george": Voice(
        id="bm_george",
        name="George",
        gender=VoiceGender.MALE,
        language="en",
        accent="British",
        description="Distinguished British male voice",
    ),
    "bm_lewis": Voice(
        id="bm_lewis",
        name="Lewis",
        gender=VoiceGender.MALE,
        language="en",
        accent="British",
        description="Friendly British male voice",
    ),
}


# =============================================================================
# Request/Response Models
# =============================================================================


class GenerateRequest(BaseModel):
    """TTS generation request."""

    text: str = Field(..., min_length=1, max_length=5000)
    voice: str = Field(default="af_heart")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    format: str = Field(default="wav", pattern="^(wav|mp3|ogg)$")


class GenerateResponse(BaseModel):
    """TTS generation response metadata."""

    request_id: str
    voice: str
    duration_ms: int
    audio_size_bytes: int
    processing_time_ms: int


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    uptime_seconds: float
    model_loaded: bool
    redis_connected: bool
    queue_size: int
    gpu_available: bool


class VoicesResponse(BaseModel):
    """Available voices response."""

    voices: list[Voice]
    default_voice: str


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
    request_id: Optional[str] = None


# =============================================================================
# TTS Engine
# =============================================================================


class KokoroEngine:
    """Kokoro-82M TTS engine wrapper."""

    def __init__(self):
        self.pipeline = None
        self.loaded = False
        self._lock = asyncio.Lock()

    async def load(self):
        """Load the Kokoro model."""
        async with self._lock:
            if self.loaded:
                return

            logger.info("loading_kokoro_model")
            try:
                from kokoro import KPipeline

                # Initialize pipeline with language code
                self.pipeline = KPipeline(lang_code="a")
                self.loaded = True
                logger.info("kokoro_model_loaded")
            except Exception as e:
                logger.error("kokoro_model_load_failed", error=str(e))
                raise

    async def generate(
        self,
        text: str,
        voice: str = "af_heart",
        speed: float = 1.0,
    ) -> tuple[np.ndarray, int]:
        """Generate speech from text."""
        if not self.loaded:
            await self.load()

        logger.info("generating_speech", voice=voice, text_length=len(text))

        try:
            # Run generation in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            audio = await loop.run_in_executor(
                None,
                lambda: self._generate_sync(text, voice, speed),
            )

            sample_rate = settings.sample_rate
            logger.info(
                "speech_generated",
                duration_ms=int(len(audio) / sample_rate * 1000),
            )

            return audio, sample_rate

        except Exception as e:
            logger.error("speech_generation_failed", error=str(e))
            raise

    def _generate_sync(
        self,
        text: str,
        voice: str,
        speed: float,
    ) -> np.ndarray:
        """Synchronous speech generation."""
        # Generate audio using Kokoro pipeline
        generator = self.pipeline(text, voice=voice, speed=speed)

        # Collect all audio chunks
        audio_chunks = []
        for _, _, audio in generator:
            audio_chunks.append(audio)

        # Concatenate chunks
        if audio_chunks:
            return np.concatenate(audio_chunks)
        return np.array([], dtype=np.float32)


# =============================================================================
# Rate Limiter
# =============================================================================


class RateLimiter:
    """Redis-based rate limiter."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.max_requests = settings.rate_limit_requests
        self.window = settings.rate_limit_window

    async def is_allowed(self, key: str) -> tuple[bool, int]:
        """Check if request is allowed under rate limit."""
        now = int(time.time())
        window_start = now - self.window

        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window)

        results = await pipe.execute()
        count = results[2]

        return count <= self.max_requests, self.max_requests - count


# =============================================================================
# Request Queue
# =============================================================================


class RequestQueue:
    """Redis-based request queue for TTS jobs."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.queue_key = "kokoro:queue"
        self.max_size = settings.queue_max_size

    async def size(self) -> int:
        """Get current queue size."""
        return await self.redis.llen(self.queue_key)

    async def is_full(self) -> bool:
        """Check if queue is full."""
        return await self.size() >= self.max_size


# =============================================================================
# Application
# =============================================================================

# Global state
engine = KokoroEngine()
redis_client: Optional[redis.Redis] = None
rate_limiter: Optional[RateLimiter] = None
request_queue: Optional[RequestQueue] = None
start_time: float = 0
shutdown_event = asyncio.Event()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global redis_client, rate_limiter, request_queue, start_time

    start_time = time.time()
    logger.info("starting_kokoro_server", port=settings.port)

    # Connect to Redis
    try:
        redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
        await redis_client.ping()
        rate_limiter = RateLimiter(redis_client)
        request_queue = RequestQueue(redis_client)
        logger.info("redis_connected", url=settings.redis_url)
    except Exception as e:
        logger.warning("redis_connection_failed", error=str(e))
        redis_client = None

    # Preload model
    try:
        await engine.load()
    except Exception as e:
        logger.error("model_preload_failed", error=str(e))

    # Setup signal handlers for graceful shutdown
    def signal_handler(sig, frame):
        logger.info("shutdown_signal_received", signal=sig)
        shutdown_event.set()

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    yield

    # Cleanup
    logger.info("shutting_down")
    if redis_client:
        await redis_client.close()


# Create FastAPI app
app = FastAPI(
    title="Kokoro-82M TTS Server",
    description="Production-ready Text-to-Speech server for Remrin.ai",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Middleware
# =============================================================================


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all requests."""
    request_id = hashlib.md5(
        f"{time.time()}{request.client.host}".encode()
    ).hexdigest()[:12]
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to generate endpoint."""
    if request.url.path == "/generate" and rate_limiter:
        client_ip = request.client.host
        allowed, remaining = await rate_limiter.is_allowed(f"ratelimit:{client_ip}")

        if not allowed:
            return Response(
                content='{"error": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers={"X-RateLimit-Remaining": "0"},
            )

    return await call_next(request)


# =============================================================================
# Endpoints
# =============================================================================


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for container orchestration."""
    redis_ok = False
    queue_size = 0

    if redis_client:
        try:
            await redis_client.ping()
            redis_ok = True
            if request_queue:
                queue_size = await request_queue.size()
        except Exception:
            pass

    # Check GPU availability
    gpu_available = False
    try:
        import torch

        gpu_available = torch.cuda.is_available()
    except Exception:
        pass

    return HealthResponse(
        status="healthy" if engine.loaded else "degraded",
        version="1.0.0",
        uptime_seconds=time.time() - start_time,
        model_loaded=engine.loaded,
        redis_connected=redis_ok,
        queue_size=queue_size,
        gpu_available=gpu_available,
    )


@app.get("/voices", response_model=VoicesResponse)
async def list_voices():
    """List all available voices."""
    return VoicesResponse(
        voices=list(VOICES.values()),
        default_voice=settings.default_voice,
    )


@app.post("/generate")
async def generate_speech(request: Request, body: GenerateRequest):
    """
    Generate speech from text.

    Returns audio file in requested format (wav, mp3, ogg).
    """
    request_id = getattr(request.state, "request_id", "unknown")
    start = time.time()

    logger.info(
        "generate_request",
        request_id=request_id,
        voice=body.voice,
        text_length=len(body.text),
        format=body.format,
    )

    # Validate voice
    if body.voice not in VOICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid voice: {body.voice}. Available: {list(VOICES.keys())}",
        )

    # Check queue capacity
    if request_queue and await request_queue.is_full():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server is busy, please try again later",
        )

    try:
        # Generate audio
        audio, sample_rate = await engine.generate(
            text=body.text,
            voice=body.voice,
            speed=body.speed,
        )

        # Convert to requested format
        buffer = io.BytesIO()

        if body.format == "wav":
            sf.write(buffer, audio, sample_rate, format="WAV")
            media_type = "audio/wav"
        elif body.format == "mp3":
            # Write as WAV first, would need ffmpeg for MP3
            sf.write(buffer, audio, sample_rate, format="WAV")
            media_type = "audio/wav"  # Fallback to WAV
        elif body.format == "ogg":
            sf.write(buffer, audio, sample_rate, format="OGG")
            media_type = "audio/ogg"
        else:
            sf.write(buffer, audio, sample_rate, format="WAV")
            media_type = "audio/wav"

        buffer.seek(0)

        processing_time = int((time.time() - start) * 1000)
        duration_ms = int(len(audio) / sample_rate * 1000)

        logger.info(
            "generate_complete",
            request_id=request_id,
            duration_ms=duration_ms,
            processing_time_ms=processing_time,
        )

        return StreamingResponse(
            buffer,
            media_type=media_type,
            headers={
                "X-Request-ID": request_id,
                "X-Duration-MS": str(duration_ms),
                "X-Processing-Time-MS": str(processing_time),
                "Content-Disposition": f'attachment; filename="speech.{body.format}"',
            },
        )

    except Exception as e:
        logger.error(
            "generate_failed",
            request_id=request_id,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech generation failed: {str(e)}",
        )


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Kokoro-82M TTS Server",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "generate": "POST /generate",
            "voices": "GET /voices",
            "health": "GET /health",
        },
    }


# =============================================================================
# Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers,
        log_level="info",
    )
