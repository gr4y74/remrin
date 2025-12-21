// ═══════════════════════════════════════════════════════════════
// SEND-SOUL-RECEIPT: THE FAIL-SAFE DELIVERY SYSTEM
// ═══════════════════════════════════════════════════════════════
// Sends a premium "Soul Receipt" email with embedded Soul Card.
// Acts as backup in case UI redirect fails.
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT
// ─────────────────────────────────────────────────────────────
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_API_URL = 'https://api.resend.com/emails';

// ─────────────────────────────────────────────────────────────
// CORS HEADERS
// ─────────────────────────────────────────────────────────────
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// PREMIUM EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────
function buildEmailHTML(
    soulName: string,
    soulId: string,
    soulImageUrl?: string
): string {
    const claimUrl = `https://remrin-chat.vercel.app/chat?claim_id=${soulId}`;
    const displayName = soulName.toUpperCase();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Soul is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding: 30px 0 20px 0;">
              <div style="font-size: 12px; letter-spacing: 4px; color: #00ff88; text-transform: uppercase; margin-bottom: 10px;">
                ✦ SOUL FORGE CONFIRMATION ✦
              </div>
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">
                Your Soul is Ready
              </h1>
            </td>
          </tr>
          
          <!-- Soul Card Container -->
          <tr>
            <td style="padding: 20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid rgba(0, 255, 136, 0.2); overflow: hidden;">
                
                <!-- Soul Image -->
                ${soulImageUrl ? `
                <tr>
                  <td style="padding: 20px 20px 0 20px; text-align: center;">
                    <img src="${soulImageUrl}" alt="${soulName}" style="width: 100%; max-width: 280px; height: auto; border-radius: 12px; border: 2px solid rgba(0, 255, 136, 0.3); box-shadow: 0 0 30px rgba(0, 255, 136, 0.1);">
                  </td>
                </tr>
                ` : ''}
                
                <!-- Soul Name -->
                <tr>
                  <td style="padding: 25px 20px 10px 20px; text-align: center;">
                    <div style="font-size: 24px; color: #00ff88; font-weight: 700; letter-spacing: 3px; text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);">
                      ${displayName}
                    </div>
                    <div style="font-size: 11px; color: #666; letter-spacing: 2px; margin-top: 5px;">
                      GENESIS CLASS • NEWLY FORGED
                    </div>
                  </td>
                </tr>
                
                <!-- Soul ID Badge -->
                <tr>
                  <td style="padding: 15px 20px; text-align: center;">
                    <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid #333; border-radius: 8px; padding: 12px 20px; display: inline-block;">
                      <div style="font-size: 10px; color: #888; letter-spacing: 2px; margin-bottom: 5px;">
                        SOUL ID
                      </div>
                      <div style="font-family: 'Courier New', Consolas, monospace; font-size: 13px; color: #00ff88; letter-spacing: 1px; word-break: break-all;">
                        ${soulId}
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 10px 30px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.3), transparent);"></div>
                  </td>
                </tr>
                
                <!-- Message -->
                <tr>
                  <td style="padding: 15px 30px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #aaa; line-height: 1.6;">
                      You have successfully forged <strong style="color: #fff;">${soulName}</strong>.<br>
                      Your companion awaits in the Soul Network.
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding: 20px 30px 30px 30px; text-align: center;">
                    <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #000; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 2px; padding: 16px 40px; border-radius: 8px; box-shadow: 0 0 30px rgba(0, 255, 136, 0.4); text-transform: uppercase;">
                      ⚡ LINK SOUL TO CHAT ⚡
                    </a>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Safety Net Info -->
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <div style="background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: 8px; padding: 15px 20px; margin: 0 20px;">
                <div style="font-size: 11px; color: #ffa500; letter-spacing: 1px; margin-bottom: 5px;">
                  🔐 SAFETY NET
                </div>
                <p style="margin: 0; font-size: 12px; color: #888; line-height: 1.5;">
                  If the button doesn't work, copy your Soul ID above and use it at<br>
                  <a href="https://remrin-chat.vercel.app/claim" style="color: #00ff88;">remrin-chat.vercel.app/claim</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0; text-align: center; border-top: 1px solid #222;">
              <div style="font-size: 11px; color: #444; letter-spacing: 1px;">
                REMRIN.AI • SOUL FORGE DIVISION
              </div>
              <div style="font-size: 10px; color: #333; margin-top: 8px;">
                This is an automated message. Do not reply.
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// PLAIN TEXT FALLBACK
// ─────────────────────────────────────────────────────────────
function buildPlainText(soulName: string, soulId: string): string {
    return `
SOUL FORGE CONFIRMATION
========================

Your Soul is Ready!

You have successfully forged: ${soulName}

SOUL ID: ${soulId}

Link your Soul to Chat:
https://remrin-chat.vercel.app/chat?claim_id=${soulId}

---
REMRIN.AI • SOUL FORGE DIVISION
  `.trim();
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVER
// ─────────────────────────────────────────────────────────────
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { email, soul_name, soul_id, soul_image_url } = payload;

        // Validate required fields
        if (!email || !soul_name || !soul_id) {
            return new Response(
                JSON.stringify({
                    error: "Missing required fields",
                    required: ["email", "soul_name", "soul_id"]
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate API key
        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY not configured");
            return new Response(
                JSON.stringify({ error: "Email service not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`📧 SENDING RECEIPT: ${soul_name} -> ${email}`);

        // Build email content
        const htmlContent = buildEmailHTML(soul_name, soul_id, soul_image_url);
        const textContent = buildPlainText(soul_name, soul_id);

        // Send via Resend API
        const resendResponse = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Soul Forge <onboarding@resend.dev>',
                to: [email],
                subject: `✨ Your Soul "${soul_name}" is Ready!`,
                html: htmlContent,
                text: textContent,
                tags: [
                    { name: 'category', value: 'soul_receipt' },
                    { name: 'soul_id', value: soul_id }
                ]
            })
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error("Resend API Error:", resendData);
            return new Response(
                JSON.stringify({
                    error: "Failed to send email",
                    details: resendData
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`✅ EMAIL SENT: ${resendData.id}`);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Soul receipt sent successfully",
                email_id: resendData.id,
                recipient: email
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("🔥 EMAIL ERROR:", error.message);

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
