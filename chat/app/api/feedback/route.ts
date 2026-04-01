import { NextRequest, NextResponse } from 'next/server';
// import { Resend } from 'resend'; // Uncomment when Resend is installed

// const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { report, sessionId } = await req.json();

    console.log(`📩 [FeedbackAPI] Received Report for Session ${sessionId}:`);
    console.log(report);

    // Placeholder for actual email sending logic
    // if (process.env.RESEND_API_KEY) {
    //   await resend.emails.send({
    //     from: 'rem@remrin.ai',
    //     to: 'sosu.remrin@gmail.com',
    //     subject: `Alpha Feedback Report — Session ${sessionId}`,
    //     text: report,
    //   });
    // }

    return NextResponse.json({ 
      success: true, 
      message: 'Feedback received successfully. If backend email is not configured, please ensure the user completed the mailto fallback.' 
    });
  } catch (error) {
    console.error('❌ [FeedbackAPI] Error processing feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
