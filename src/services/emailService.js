// src/services/emailService.js
import nodemailer from 'nodemailer';
import config from '../config/config.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if SMTP is configured
    if (config.email?.host && config.email?.user && config.email?.password) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port || 587,
        secure: config.email.secure || false,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
      this.isConfigured = true;
      console.log('📧 Email service configured');
    } else {
      console.log('📧 Email service not configured - will log emails to console');
    }
  }

  async sendEmail(to, subject, html, text) {
    const mailOptions = {
      from: config.email?.from || 'Raamul E-Commerce <noreply@raamul.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('Email send error:', error);
        throw new Error('Failed to send email');
      }
    } else {
      // Dev mode - log to console
      console.log('\n📧 ========== EMAIL (Dev Mode) ==========');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', text || html.replace(/<[^>]*>/g, ''));
      console.log('========================================\n');
      return { success: true, devMode: true };
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    const subject = 'Reset Your Password - Raamul E-Commerce';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </p>
        <p style="color: #999; font-size: 12px;">
          Reset Token (for API): <code>${resetToken}</code>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordChangedEmail(email, username) {
    const subject = 'Password Changed Successfully - Raamul E-Commerce';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Hello ${username},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated message from Raamul E-Commerce.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendVerificationEmail(email, verificationToken, verificationUrl) {
    const subject = 'Verify Your Email - Raamul E-Commerce';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Raamul E-Commerce!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2196F3; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Verification Token (for API): <code>${verificationToken}</code>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

export default new EmailService();

