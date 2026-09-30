require('dotenv').config();
const { sendVerificationOtp } = require('../src/lib/mailer');

describe('Mailer Service (Resend & Fallback)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should format and send an OTP via Resend when RESEND_API_KEY is configured', async () => {
    const res = await sendVerificationOtp('arellaraghavendra@gmail.com', '654321');
    expect(res.success).toBe(true);
    expect(res.provider).toBe('resend');
    expect(res.messageId).toBeDefined();
  });

  it('should fall back to console-only mode in development when no keys are provided', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.NODE_ENV = 'development';

    const res = await sendVerificationOtp('test@example.com', '123456');
    expect(res.success).toBe(true);
    expect(res.mode).toBe('console-only');
  });

  it('should throw an error in production when no email provider is configured', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    process.env.NODE_ENV = 'production';

    await expect(sendVerificationOtp('test@example.com', '123456')).rejects.toThrow(
      'Email delivery service is not configured'
    );
  });
});
