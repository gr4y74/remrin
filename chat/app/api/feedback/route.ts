import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { report, sessionId } = await req.json();

    console.log(`📩 [FeedbackAPI] Received Report for Session ${sessionId}:`);
    console.log(report);

    // Backend email delivery via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'rem@remrin.ai',
        to: 'sosu.remrin@gmail.com',
        subject: `Alpha Feedback Report — Session ${sessionId}`,
        text: report,
      });
      console.log('✅ [FeedbackAPI] Email sent successfully via Resend.');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received successfully.' 
    });
  } catch (error) {
    console.error('❌ [FeedbackAPI] Error processing feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
