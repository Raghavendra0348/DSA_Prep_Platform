const nodemailer = require('nodemailer');

// ── Configure Nodemailer Transporter ─────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    if (host.includes('gmail')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  return transporter;
}


/**
 * Generates an ultra-premium, modern dark-themed HTML email template
 * Bulletproof inline styling compatible across Gmail, Apple Mail, Outlook, and mobile apps.
 */
function buildOtpEmailHtml(otp) {
  const currentYear = new Date().getFullYear();
  const digits = String(otp).split('');

  // Generate individual 6 digit badge HTML for rich segmented presentation
  const digitBadgesHtml = digits.map(d => `
    <td style="padding: 0 4px;">
      <div style="width: 44px; height: 54px; line-height: 54px; text-align: center; background: #0f172a; border: 1.5px solid #38bdf8; border-radius: 10px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 28px; font-weight: 800; color: #38bdf8; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15); margin: 0 auto;">
        ${d}
      </div>
    </td>
  `).join('');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>DSA Prep — Verification Code</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 10px auto !important; }
      .otp-digit { width: 36px !important; height: 46px !important; line-height: 46px !important; font-size: 22px !important; }
      .content-cell { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #e2e8f0;">

  <!-- Outer wrapper table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030712; padding: 40px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="540" style="max-width: 540px; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Header Banner with Gradient Glow -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); padding: 36px 32px 28px; text-align: center; border-bottom: 1px solid #1e293b;">
              
              <!-- Brand Logo Icon & Name -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%); padding: 8px 14px; border-radius: 12px; font-family: monospace; font-size: 16px; font-weight: 900; color: #ffffff; letter-spacing: 1px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                    &lt;/&gt;
                  </td>
                  <td style="padding-left: 12px; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                    DSA<span style="color: #38bdf8;">Prep</span>
                  </td>
                </tr>
              </table>

              <!-- Subtitle Badge -->
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px;">
                  Security Verification
                </span>
              </div>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="content-cell" style="padding: 36px 32px 28px;">
              
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #f8fafc; text-align: center; letter-spacing: -0.3px;">
                Verify Your Email Address
              </h1>
              
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Welcome to <strong style="color: #f1f5f9;">DSA Prep</strong>. To complete your account creation and begin practicing top curated interview patterns, please use the 6-digit verification code below:
              </p>

              <!-- OTP Code Segmented Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(180deg, #0d1527 0%, #0a0f1d 100%); border: 1px solid #1e3a8a; border-radius: 16px; padding: 24px 16px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    
                    <!-- Segmented Digits Row -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        ${digitBadgesHtml}
                      </tr>
                    </table>

                    <!-- Timer and Action Tag -->
                    <div style="margin-top: 18px; font-size: 13px; color: #64748b;">
                      <span style="color: #fbbf24; font-weight: 600;"> Valid for 10 minutes</span>
                      &nbsp;•&nbsp;
                      <span style="color: #94a3b8;">Single-use only</span>
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Security Advice Notice -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(30, 41, 59, 0.5); border-left: 3px solid #38bdf8; border-radius: 6px; padding: 12px 16px; margin-bottom: 28px;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.5; color: #94a3b8;">
                     <strong style="color: #cbd5e1;">Security Notice:</strong> Never share this code with anyone. DSA Prep support staff will never ask for your verification code or password.
                  </td>
                </tr>
              </table>

              <!-- Platform Feature Highlights -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #1e293b; padding-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">
                      What's waiting for you inside
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 8px; font-size: 12px; color: #94a3b8;"> <strong>428+</strong> Companies</td>
                        <td style="padding: 4px 8px; font-size: 12px; color: #94a3b8;"> <strong>50+</strong>   Topics</td>

                      </tr>
                    </table
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #050811; padding: 24px 32px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you didn't request this email, someone may have entered your address by mistake. You can safely ignore it.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${currentYear} DSA Prep Platform • Master Data Structures & Algorithms
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Container -->

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}


/**
 * Sends a 6-digit verification OTP to the user's email.
 * Includes console fallback if SMTP is unavailable in local dev.
 */
async function sendVerificationOtp(email, otp) {
  const from = process.env.SMTP_FROM || `"DSA Prep" <${process.env.SMTP_USER || 'noreply@dsaprep.dev'}>`;
  const mailTransporter = getTransporter();

  // Always log to terminal in non-production for instant testing visibility
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`🔑 [EMAIL OTP] To: ${email}`);
    console.log(`👉 Verification Code: ${otp} (Valid for 10 min)`);
    console.log(`======================================================\n`);
  }

  if (!mailTransporter) {
    console.warn(`[mailer] SMTP credentials missing. OTP was printed to console.`);
    return { success: true, mode: 'console-only' };
  }

  try {
    const info = await mailTransporter.sendMail({
      from,
      to: email,
      subject: `${otp} is your DSA Prep verification code`,
      text: `Your DSA Prep verification code is: ${otp}. It expires in 10 minutes.`,
      html: buildOtpEmailHtml(otp),
    });

    console.log(`[mailer] OTP email delivered to ${email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${email}:`, err.message);
    // In dev mode, don't crash if network SMTP failed — developer can still use console OTP
    if (process.env.NODE_ENV !== 'production') {
      return { success: true, mode: 'dev-fallback-after-error' };
    }
    throw new Error('Failed to send verification email. Please check your email address or try again later.');
  }
}

module.exports = {
  sendVerificationOtp,
};
