import { NextResponse } from 'next/server';
import { getKokoroProvider } from '@/lib/audio/providers/KokoroProvider';

/**
 * GET /api/audio/kokoro/health
 * 
 * Health check endpoint for Kokoro TTS server.
 * Used by admin dashboard to monitor service status.
 * 
 * Returns:
 * - status: 'healthy' | 'degraded' | 'down'
 * - latency: Response time in milliseconds
 * - queueSize: Current request queue size
 * - activeRequests: Number of active requests
 * - lastCheck: ISO timestamp of the check
 */

// Cache health check results for 10 seconds
let cachedHealth: {
    data: unknown;
    timestamp: number;
} | null = null;

const CACHE_TTL = 10000; // 10 seconds

export async function GET() {
    try {
        const now = Date.now();

        // Return cached result if still fresh
        if (cachedHealth && (now - cachedHealth.timestamp) < CACHE_TTL) {
            return NextResponse.json(cachedHealth.data);
        }

        // Get Kokoro provider
        const kokoroProvider = getKokoroProvider();

        // Measure latency
        const startTime = Date.now();
        const status = await kokoroProvider.getStatus();
        const latency = Date.now() - startTime;

        // Get queue status
        const queueStatus = kokoroProvider.getQueueStatus();

        // Build health response
        const healthData = {
            status: status.available ? 'healthy' : 'down',
            latency,
            queueSize: queueStatus.queueSize,
            activeRequests: queueStatus.activeRequests,
            maxConcurrent: queueStatus.maxConcurrent,
            maxQueueSize: queueStatus.maxQueueSize,
            message: status.message,
            lastCheck: new Date().toISOString(),
        };

        // Cache the result
        cachedHealth = {
            data: healthData,
            timestamp: now,
        };

        return NextResponse.json(healthData);

    } catch (error) {
        console.error('[API] Kokoro health check failed:', error);

        const errorData = {
            status: 'down',
            latency: 0,
            queueSize: 0,
            activeRequests: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
            lastCheck: new Date().toISOString(),
        };

        return NextResponse.json(errorData, { status: 503 });
    }
}
