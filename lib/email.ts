/**
 * lib/email.ts
 * Transactional email via SMTP (nodemailer).
 * Falls back to console.log in dev when SMTP_HOST is not set.
 */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ id?: string }> {
  const fromName = process.env.SMTP_FROM_NAME || process.env.FROM_NAME || "Assets Flow";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || "no-reply@assetflow.app";
  const from = `"${fromName}" <${fromEmail}>`;
  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];

  // ── Dev fallback: no SMTP config ─────────────────────────────────────────
  if (!process.env.SMTP_HOST) {
    console.log("\n──────────────────────────────────────────────────────");
    console.log("[DEV EMAIL — not sent, no SMTP_HOST configured]");
    console.log(`To:      ${toList.join(", ")}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${opts.subject}`);
    console.log("Body:");
    console.log(opts.text ?? opts.html.replace(/<[^>]*>/g, ""));
    console.log("──────────────────────────────────────────────────────\n");
    return { id: "dev-no-send" };
  }

  // ── Production: send via SMTP ─────────────────────────────────────────────
  try {
    const nodemailer = await import("nodemailer");
    const crypto = await import("crypto");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from,
      replyTo: fromEmail,
      to: toList.join(", "),
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]*>?/gm, ''), // Ensure plain-text fallback always exists
      headers: {
        'X-Priority': '1', // High priority helps with some transactional filters
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
      messageId: `<${crypto.randomUUID()}@${fromEmail.split('@')[1] || 'assetflow.app'}>`,
    });

    return { id: info.messageId };
  } catch (error) {
    console.error("Failed to send email via Nodemailer", error);
    return { id: undefined };
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function otpEmailHtml(code: string, expiresInMinutes = 10): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AssetFlow";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563EB;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:600;">${appName}</p>
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
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AssetFlow";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563EB;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:600;">${appName}</p>
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

export function welcomeEmailHtml(name: string): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AssetFlow";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563EB;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:600;">${appName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#111827;">Welcome, ${name}!</h2>
            <p style="margin:0 0 24px;color:#4B5563;font-size:14px;line-height:1.6;">
              Your account is ready. Start tracking and managing your organization's assets.
            </p>
            <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563EB;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Go to Dashboard
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function notificationEmailHtml(title: string, message: string, actionUrl?: string): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AssetFlow";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #000000;border-radius:0;overflow:hidden;">
        <tr>
          <td style="background:#000000;padding:20px 32px;">
            <p style="margin:0;color:#FFFFFF;font-size:18px;font-weight:600;letter-spacing:1px;">${appName.toUpperCase()}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#000000;">${title}</h2>
            <p style="margin:0 0 32px;color:#000000;font-size:15px;line-height:1.6;">
              ${message}
            </p>
            ${actionUrl ? `
            <a href="${actionUrl}" style="display:inline-block;background:#000000;color:#FFFFFF;font-size:14px;font-weight:600;padding:14px 28px;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">
              View Details
            </a>
            ` : ''}
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;color:#6B7280;font-size:12px;">
                This is an automated notification from ${appName}.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
