import nodemailer from 'nodemailer';

/**
 * Service to manage sending emails (Gmail SMTP, Custom SMTP, Resend API, SendGrid API, or Ethereal sandbox)
 */

let etherealTransporter = null;

// Dynamic runtime email configuration (allows setting credentials via admin or verification workflow)
let runtimeEmailConfig = {
  resendApiKey: null,
  smtpUser: null,
  smtpPass: null,
};

export const setRuntimeEmailConfig = ({ resendApiKey, smtpUser, smtpPass } = {}) => {
  if (resendApiKey) runtimeEmailConfig.resendApiKey = resendApiKey.trim();
  if (smtpUser) runtimeEmailConfig.smtpUser = smtpUser.trim();
  if (smtpPass) runtimeEmailConfig.smtpPass = smtpPass.trim().replace(/\s+/g, '');
};

export const getRuntimeEmailConfig = () => ({ ...runtimeEmailConfig });

/**
 * Check if Gmail is the target email service
 */
export const isGmailConfigured = () => {
  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || '').toLowerCase();
  const service = (process.env.EMAIL_SERVICE || '').toLowerCase();
  const hasGmailUser = !!(process.env.GMAIL_USER || runtimeEmailConfig.smtpUser?.includes('gmail'));
  return host.includes('gmail') || service === 'gmail' || hasGmailUser;
};

/**
 * Determine sender address
 */
export const getSenderAddress = () => {
  if (runtimeEmailConfig.smtpUser) {
    return `"CBDP Human Resources" <${runtimeEmailConfig.smtpUser}>`;
  }
  if (process.env.RESEND_FROM) {
    return process.env.RESEND_FROM.trim();
  }
  if ((runtimeEmailConfig.resendApiKey || process.env.RESEND_API_KEY) && !process.env.SMTP_FROM && !process.env.EMAIL_FROM && !isGmailConfigured()) {
    return 'CBDP Human Resources <onboarding@resend.dev>';
  }
  if (isGmailConfigured()) {
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
    if (gmailUser) {
      return `"CBDP Human Resources" <${gmailUser.trim()}>`;
    }
  }
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || '"CBDP Human Resources" <no-reply@cbdp.org>';
};

/**
 * Creates or retrieves a configured nodemailer transporter
 */
export const getTransporter = async () => {
  const isGmail = isGmailConfigured();
  const user = runtimeEmailConfig.smtpUser || process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
  const rawPass = runtimeEmailConfig.smtpPass || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

  // 1. Dedicated Gmail Transport
  if (isGmail && user && rawPass) {
    // Strip any accidental spaces from 16-character Google App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    const pass = rawPass.replace(/\s+/g, '');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass,
      },
    });
  }

  // 2. Custom Standard SMTP Transport (Brevo, AWS SES, Mailgun, SendGrid SMTP, etc.)
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && rawPass) {
    const pass = rawPass.trim();
    return nodemailer.createTransport({
      host: host.trim(),
      port,
      secure,
      auth: {
        user: user.trim(),
        pass,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  // 3. Fallback for Local Development & Testing: Ethereal Sandbox
  if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_ETHEREAL_SANDBOX === 'true') {
    if (!etherealTransporter) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        console.log(`[Email Service] Initialized Ethereal sandbox test account: ${testAccount.user}`);
        etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (err) {
        console.warn('[Email Service] Failed to initialize Ethereal sandbox:', err.message);
        return null;
      }
    }
    return etherealTransporter;
  }

  return null;
};

/**
 * Send email via Resend REST API (ideal for serverless / Vercel where outbound SMTP sockets might be blocked)
 */
const sendViaResend = async ({ to, subject, html, text, from }) => {
  const apiKey = runtimeEmailConfig.resendApiKey || process.env.RESEND_API_KEY || process.env.resend_api_key || process.env.RESEND_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) return null;

  let sender = from || getSenderAddress();

  let response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  let data = await response.json();

  // If custom sender domain fails due to unverified domain status, fallback to onboarding@resend.dev
  if (!response.ok && data.message && (data.message.toLowerCase().includes('domain') || data.message.toLowerCase().includes('verify')) && !sender.includes('resend.dev')) {
    console.warn(`[Email Service] Sender domain unverified (${sender}). Retrying with onboarding@resend.dev...`);
    sender = 'CBDP Human Resources <onboarding@resend.dev>';
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data.message || `Resend API failed with status ${response.status}`);
  }

  return { success: true, messageId: data.id, provider: 'resend' };
};

/**
 * Send email via SendGrid REST API
 */
const sendViaSendGrid = async ({ to, subject, html, text, from }) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return null;

  const senderEmail = (from || getSenderAddress()).replace(/.*<([^>]+)>.*/, '$1').trim();

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: senderEmail },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API failed with status ${response.status}: ${errorText}`);
  }

  return { success: true, provider: 'sendgrid' };
};

/**
 * Build professional HTML & text templates for 6-digit verification code
 */
const buildVerificationEmailContent = ({ code, expiresInMinutes = 10, employeeName }) => {
  const salutation = employeeName ? `Hello ${employeeName},` : 'Hello Team Member,';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CBDP Password Reset Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .body-content { padding: 36px 32px; }
    .salutation { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .lead-text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .code-card { background: #f8fafc; border: 2px dashed #10b981; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0; }
    .code-label { font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    .code-value { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #064e3b; margin: 0; padding-left: 10px; }
    .expiry-badge { display: inline-block; margin-top: 10px; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; }
    .notice { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 16px; margin-top: 24px; }
    .notice-title { font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
    .notice-text { font-size: 12px; color: #b45309; line-height: 1.5; margin: 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Center for Development &amp; Peace</h1>
      <p>Human Resource Management Platform</p>
    </div>
    <div class="body-content">
      <div class="salutation">${salutation}</div>
      <p class="lead-text">
        We received a request to verify and reset the password for your CBDP Portal account. Use the six-digit verification code below to authorize your password update:
      </p>

      <div class="code-card">
        <div class="code-label">Verification Code</div>
        <div class="code-value">${code}</div>
        <div class="expiry-badge">⏱ Expires in ${expiresInMinutes} minutes &bull; Single-use only</div>
      </div>

      <p class="lead-text" style="font-size: 13px; color: #64748b;">
        Enter this code on the password reset verification page to set your new credentials.
      </p>

      <div class="notice">
        <div class="notice-title">Security Notice</div>
        <p class="notice-text">
          If you did not request a password reset, please ignore this email or notify your HR Administrator immediately. Your password will remain unchanged.
        </p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} CBDP HRM. All rights reserved.</p>
      <p>Automated security notification &bull; Do not reply to this email</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Center for Development & Peace - Password Reset Code
====================================================

${salutation}

We received a request to reset your CBDP Portal password.

Your 6-digit verification code is: ${code}

This verification code expires in ${expiresInMinutes} minutes and can only be used once.

If you did not request a password reset, please ignore this message or contact your HR Administrator immediately.

Center for Development & Peace (CBDP)
Automated System Notification
  `.trim();

  return { html, text };
};

/**
 * Send the 6-digit verification code to the employee's email address
 */
export const sendVerificationCodeEmail = async ({ to, code, expiresInMinutes = 10, employeeName }) => {
  if (!to || !to.includes('@')) {
    throw new Error('A valid destination email address is required.');
  }

  if (!code || code.length !== 6) {
    throw new Error('A valid 6-digit verification code is required.');
  }

  const subject = `Your CBDP Password Reset Verification Code: ${code}`;
  const { html, text } = buildVerificationEmailContent({ code, expiresInMinutes, employeeName });
  const from = getSenderAddress();

  // 1. Try Resend API if configured
  if (process.env.RESEND_API_KEY || process.env.resend_api_key || process.env.RESEND_KEY || process.env.VITE_RESEND_API_KEY) {
    try {
      const res = await sendViaResend({ to, subject, html, text, from });
      console.log(`[Email Service] Code successfully dispatched via Resend to ${to} (ID: ${res.messageId})`);
      return res;
    } catch (err) {
      console.error('[Email Service] Resend API delivery error:', err.message);
    }
  }

  // 2. Try SendGrid API if configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await sendViaSendGrid({ to, subject, html, text, from });
      console.log(`[Email Service] Code successfully dispatched via SendGrid to ${to}`);
      return res;
    } catch (err) {
      console.error('[Email Service] SendGrid API delivery error:', err.message);
    }
  }

  // 3. Nodemailer SMTP transport (Gmail or Custom SMTP)
  const transporter = await getTransporter();
  if (!transporter) {
    throw new Error(
      'Email delivery service is not configured. ' +
      'Please configure Gmail credentials (SMTP_USER and SMTP_PASS with a 16-character Google App Password) ' +
      'or configure RESEND_API_KEY in your environment variables.'
    );
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service] Verification email dispatched to sandbox:`);
      console.log(`[Email Service] Recipient: ${to}`);
      console.log(`[Email Service] Preview URL: ${previewUrl}`);
    } else {
      console.log(`[Email Service] Email sent successfully to ${to} (MessageId: ${info.messageId})`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
      provider: previewUrl ? 'ethereal' : (isGmailConfigured() ? 'gmail' : 'smtp'),
    };
  } catch (error) {
    console.error(`[Email Service] SMTP delivery failed to ${to}:`, error.message);
    
    // Provide explicit troubleshooting for Google App Passwords
    if (error.message.includes('BadCredentials') || error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
      throw new Error(
        'Gmail authentication failed: Username and Password not accepted. ' +
        'Standard Google account passwords cannot be used for SMTP. ' +
        'Please generate a 16-character Google App Password via: ' +
        'Google Account -> Security -> 2-Step Verification -> App Passwords, and set it as SMTP_PASS.'
      );
    }

    if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      throw new Error(
        `Connection to mail server timed out (${error.message}). ` +
        'Serverless platforms like Vercel often restrict outbound SMTP sockets. ' +
        'Consider using RESEND_API_KEY in Vercel Environment Variables.'
      );
    }

    throw new Error(`Failed to deliver verification email to ${to}: ${error.message}`);
  }
};

/**
 * Diagnostic utility to check email configuration and connection status
 */
export const diagnoseEmailConfiguration = async () => {
  const isGmail = isGmailConfigured();
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const user = runtimeEmailConfig.smtpUser || process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = runtimeEmailConfig.smtpPass || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  const hasResend = !!(runtimeEmailConfig.resendApiKey || process.env.RESEND_API_KEY || process.env.resend_api_key || process.env.RESEND_KEY || process.env.VITE_RESEND_API_KEY);
  const hasSendGrid = !!(process.env.SENDGRID_API_KEY || process.env.sendgrid_api_key);

  const detectedEmailKeys = Object.keys(process.env).filter(k => /RESEND|SMTP|EMAIL|GMAIL|SENDGRID/i.test(k));

  const info = {
    provider: hasResend ? 'Resend REST API' : (hasSendGrid ? 'SendGrid REST API' : (isGmail ? 'Gmail SMTP' : (host ? 'Custom SMTP' : 'Sandbox (Ethereal)'))),
    hasCredentials: Boolean(hasResend || hasSendGrid || (user && pass)),
    sender: getSenderAddress(),
    smtpHost: host || (isGmail ? 'smtp.gmail.com' : null),
    smtpUserConfigured: !!user,
    smtpUserMasked: user ? `${user.substring(0, 3)}***@${user.split('@')[1] || ''}` : null,
    runtimeConfigured: Boolean(runtimeEmailConfig.resendApiKey || (runtimeEmailConfig.smtpUser && runtimeEmailConfig.smtpPass)),
    detectedEmailKeys,
    environment: process.env.NODE_ENV || 'development',
    deploymentVersion: '2026.10.21.v3',
  };

  if (hasResend || hasSendGrid) {
    info.status = 'READY_API';
    info.message = 'Transactional REST API configured. Optimal for serverless environments like Vercel.';
    return info;
  }

  if (user && pass) {
    try {
      const transporter = await getTransporter();
      if (transporter && transporter.verify) {
        await transporter.verify();
        info.status = 'CONNECTED';
        info.message = 'SMTP transport verified successfully with mail server.';
      } else {
        info.status = 'READY';
      }
    } catch (err) {
      info.status = 'AUTH_OR_CONNECTION_ERROR';
      info.error = err.message;
      if (err.message.includes('BadCredentials') || err.message.includes('535')) {
        info.recommendation = 'Google requires a 16-character App Password. Go to Google Account -> Security -> 2-Step Verification -> App Passwords.';
      }
    }
  } else {
    info.status = 'NOT_CONFIGURED';
    info.message = 'No email credentials found in environment variables. Add SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY.';
  }

  return info;
};
