/**
 * lib/email.ts
 * Thin email abstraction.
 * - If RESEND_API_KEY is set → sends via Resend
 * - Otherwise → console.logs the payload (great for local dev without a Resend account)
 */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ id?: string }> {
  const from = process.env.EMAIL_FROM ?? "AssetFlow <no-reply@assetflow.app>";

  // ── Dev fallback: no API key set ──────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.log("\n──────────────────────────────────────────────");
    console.log("[DEV EMAIL - not sent, no RESEND_API_KEY]");
    console.log(`To:      ${Array.isArray(opts.to) ? opts.to.join(", ") : opts.to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${opts.subject}`);
    console.log("Body:");
    console.log(opts.text ?? opts.html.replace(/<[^>]*>/g, ""));
    console.log("──────────────────────────────────────────────\n");
    return { id: "dev-no-send" };
  }

  // ── Production: send via Resend ───────────────────────────────────────────
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (error) {
    console.error("[Resend] send error:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return { id: data?.id };
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function otpEmailHtml(code: string, expiresInMinutes = 10): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563EB;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:600;">AssetFlow</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">Verification Code</h2>
            <p style="margin:0 0 24px;color:#4B5563;font-size:14px;line-height:1.6;">
              Use the code below to verify your identity. It expires in ${expiresInMinutes} minutes.
            </p>
            <div style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#111827;">
              ${code}
            </div>
            <p style="margin:24px 0 0;color:#9CA3AF;font-size:12px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563EB;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:600;">AssetFlow</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">Reset your password</h2>
            <p style="margin:0 0 24px;color:#4B5563;font-size:14px;line-height:1.6;">
              Click the button below to reset your password. This link expires in 60 minutes.
            </p>
            <a href="${resetUrl}" style="display:inline-block;background:#2563EB;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Reset Password
            </a>
            <p style="margin:24px 0 0;color:#9CA3AF;font-size:12px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
