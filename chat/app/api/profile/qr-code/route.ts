import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const format = searchParams.get('format') || 'png';

        if (!username) {
            return NextResponse.json({ error: 'username required' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (request.headers.get('host') ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` : 'http://localhost:3000');
        const profileUrl = `${baseUrl}/profile/${username}`;

        if (format === 'svg') {
            const svg = await QRCode.toString(profileUrl, { type: 'svg' });
            return new NextResponse(svg, {
                headers: { 'Content-Type': 'image/svg+xml' },
            });
        } else {
            const png = await QRCode.toBuffer(profileUrl, {
                width: 512,
                margin: 2,
            });
            return new NextResponse(png, {
                headers: { 'Content-Type': 'image/png' },
            });
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
