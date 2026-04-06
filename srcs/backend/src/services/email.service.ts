import nodemailer from "nodemailer";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtp(to: string, code: string): Promise<void> {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await this.transporter.sendMail({
      from: `"GameHub" <${from}>`,
      to,
      subject: "Your verification code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea; text-align: center;">GameHub</h2>
          <p style="text-align: center;">Your verification code is:</p>
          <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            ${code}
          </div>
          <p style="text-align: center; color: #999; font-size: 13px; margin-top: 16px;">
            This code expires in 60 seconds.
          </p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
