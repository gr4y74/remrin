
import { NextResponse } from 'next/server'

/**
 * Chat Engine Configuration API
 * 
 * TEMPORARILY DISABLED due to build errors (MODULE_NOT_FOUND).
 * TODO: Fix imports and restore functionality.
 */

export async function GET() {
    return NextResponse.json({
        error: 'This endpoint is temporarily disabled during maintenance.',
        status: 'maintenance'
    }, { status: 503 })
}

export async function POST() {
    return NextResponse.json({
        error: 'This endpoint is temporarily disabled during maintenance.',
        status: 'maintenance'
    }, { status: 503 })
}
