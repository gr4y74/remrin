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
// BRANDING ASSETS
// ─────────────────────────────────────────────────────────────
// NOTE: For email clients, the logo must be hosted at a public URL.
// Upload your logo to Supabase Storage or a CDN and update this URL.
const LOGO_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/storage/v1/object/public/soul_forge/branding/logo.png';

// ─────────────────────────────────────────────────────────────
// PREMIUM EMAIL TEMPLATE (REMRIN VOID AESTHETIC)
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
<body style="margin: 0; padding: 0; background-color: #0b0c15; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0c15; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo -->
          <tr>
            <td style="text-align: center; padding: 20px 0 30px 0;">
              <img src="${LOGO_URL}" alt="Remrin" style="height: 40px; width: auto;" />
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding: 0 0 25px 0;">
              <div style="font-size: 11px; letter-spacing: 4px; color: #7c3aed; text-transform: uppercase; margin-bottom: 12px;">
                ✦ SOUL FORGE CONFIRMATION ✦
              </div>
              <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: 300; letter-spacing: 1px;">
                Your Soul is Ready
              </h1>
            </td>
          </tr>
          
          <!-- Soul Card Container -->
          <tr>
            <td style="padding: 10px 0 20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(160deg, #0f1019 0%, #1a1b2e 50%, #0f1019 100%); border-radius: 20px; border: 1px solid rgba(124, 58, 237, 0.3); overflow: hidden; box-shadow: 0 4px 40px rgba(124, 58, 237, 0.15);">
                
                <!-- Soul Image -->
                ${soulImageUrl ? `
                <tr>
                  <td style="padding: 25px 25px 0 25px; text-align: center;">
                    <img src="${soulImageUrl}" alt="${soulName}" style="width: 100%; max-width: 260px; height: auto; border-radius: 16px; border: 2px solid rgba(124, 58, 237, 0.4); box-shadow: 0 0 40px rgba(124, 58, 237, 0.2);">
                  </td>
                </tr>
                ` : ''}
                
                <!-- Soul Name -->
                <tr>
                  <td style="padding: 28px 20px 8px 20px; text-align: center;">
                    <div style="font-size: 26px; color: #06b6d4; font-weight: 700; letter-spacing: 4px; text-shadow: 0 0 25px rgba(6, 182, 212, 0.5);">
                      ${displayName}
                    </div>
                    <div style="font-size: 10px; color: #555; letter-spacing: 3px; margin-top: 8px; text-transform: uppercase;">
                      Genesis Class • Newly Forged
                    </div>
                  </td>
                </tr>
                
                <!-- Soul ID Badge -->
                <tr>
                  <td style="padding: 18px 20px; text-align: center;">
                    <div style="background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(124, 58, 237, 0.25); border-radius: 10px; padding: 14px 24px; display: inline-block;">
                      <div style="font-size: 9px; color: #666; letter-spacing: 3px; margin-bottom: 6px; text-transform: uppercase;">
                        Soul ID
                      </div>
                      <div style="font-family: 'SF Mono', 'Courier New', Consolas, monospace; font-size: 12px; color: #7c3aed; letter-spacing: 0.5px; word-break: break-all;">
                        ${soulId}
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 8px 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.3), transparent);"></div>
                  </td>
                </tr>
                
                <!-- Message -->
                <tr>
                  <td style="padding: 18px 35px; text-align: center;">
                    <p style="margin: 0; font-size: 15px; color: #999; line-height: 1.7;">
                      You have successfully forged <strong style="color: #fff;">${soulName}</strong>.<br>
                      Your companion awaits in the Soul Network.
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding: 22px 30px 35px 30px; text-align: center;">
                    <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 2px; padding: 18px 45px; border-radius: 10px; box-shadow: 0 0 35px rgba(124, 58, 237, 0.5), 0 0 60px rgba(6, 182, 212, 0.2); text-transform: uppercase;">
                      ⚡ LINK SOUL TO CHAT ⚡
                    </a>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Safety Net / Backup Info (Subtle Footer Style) -->
          <tr>
            <td style="padding: 25px 20px; text-align: center;">
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 18px 25px;">
                <div style="font-size: 10px; color: #444; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase;">
                  🔗 Backup Link
                </div>
                <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.6;">
                  If the button doesn't work, copy your Soul ID above and claim at<br>
                  <a href="https://remrin-chat.vercel.app/claim" style="color: #7c3aed; text-decoration: none;">remrin-chat.vercel.app/claim</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 0 20px 0; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="font-size: 10px; color: #333; letter-spacing: 2px; text-transform: uppercase;">
                Remrin.ai • Soul Forge Division
              </div>
              <div style="font-size: 9px; color: #222; margin-top: 10px;">
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
