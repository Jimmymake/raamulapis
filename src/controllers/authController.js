// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import config from "../config/config.js";
import emailService from "../services/emailService.js";

class AuthController {
  async signup(req, res) {
    const { username, email, location, phone, password, role = "user" } = req.body;

    try {
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: "Username, email, and password are required" 
        });
      }

      // Check if username already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Check if email already exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Prevent regular signup from creating admin/super_admin
      // Admin accounts should be created by existing admins through user management
      if (role === "admin" || role === "super_admin") {
        return res.status(403).json({ 
          message: "Cannot self-register as admin. Please contact system administrator." 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create(
        username,
        email,
        location,
        phone,
        hashedPassword,
        role
      );

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

      // Save verification token
      await User.setEmailVerificationToken(newUser.id, verificationToken, verificationExpires);

      // Send verification email
      const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
      await emailService.sendVerificationEmail(email, verificationToken, verificationUrl);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email, 
          role: newUser.role 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "User created successfully. Please check your email to verify your account.",
        user: userWithoutPassword,
        token,
        // Include token in dev mode for testing
        ...(process.env.NODE_ENV !== 'production' && { devVerificationToken: verificationToken })
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating user", 
        error: error.message 
      });
    }
  }

  async login(req, res) {
    const { username, password } = req.body;

    try {
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({ 
          message: "Username and password are required" 
        });
      }

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "Invalid credentials" });
      }

      // Check if account is suspended
      if (user.status === 'suspended') {
        return res.status(403).json({ 
          message: "Your account has been suspended. Please contact support." 
        });
      }

      // Check if account is inactive
      if (user.status === 'inactive') {
        return res.status(403).json({ 
          message: "Your account is inactive. Please contact support." 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error logging in", 
        error: error.message 
      });
    }
  }

  // Change password (authenticated users)
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Current password and new password are required" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "New password must be at least 6 characters long" 
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.update(user.id, { password: hashedPassword });

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: "Error changing password", 
        error: error.message 
      });
    }
  }

  // Verify token (check if token is still valid)
  async verifyToken(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ 
        valid: true,
        user: userWithoutPassword 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error verifying token", 
        error: error.message 
      });
    }
  }

  // Request password reset
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findByEmail(email);
      
      // Don't reveal if email exists or not (security)
      if (!user) {
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Save token to database
      await User.setResetPasswordToken(user.id, resetToken, resetExpires);

      // Build reset URL
      const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

      // Send email
      await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);

      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent.",
        // Include token in dev mode for testing
        ...(process.env.NODE_ENV !== 'production' && { devToken: resetToken })
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        message: "Error processing password reset request", 
        error: error.message 
      });
    }
  }

  // Reset password with token
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ 
          message: "Token and new password are required" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "Password must be at least 6 characters long" 
        });
      }

      // Find user by reset token
      const user = await User.findByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired reset token" 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await User.update(user.id, { password: hashedPassword });
      await User.clearResetToken(user.id);

      // Send confirmation email
      await emailService.sendPasswordChangedEmail(user.email, user.username);

      res.status(200).json({ 
        message: "Password has been reset successfully. You can now login with your new password." 
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ 
        message: "Error resetting password", 
        error: error.message 
      });
    }
  }

  // Verify reset token validity
  async verifyResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const user = await User.findByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ 
          valid: false,
          message: "Invalid or expired reset token" 
        });
      }

      res.status(200).json({ 
        valid: true,
        message: "Token is valid" 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error verifying token", 
        error: error.message 
      });
    }
  }

  // Verify email with token
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await User.findByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired verification token" 
        });
      }

      // Mark email as verified
      await User.verifyEmail(user.id);

      res.status(200).json({ 
        message: "Email verified successfully. You can now access all features." 
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        message: "Error verifying email", 
        error: error.message 
      });
    }
  }

  // Resend verification email
  async resendVerificationEmail(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      const isVerified = await User.isEmailVerified(userId);
      if (isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

      // Save new token
      await User.setEmailVerificationToken(userId, verificationToken, verificationExpires);

      // Send verification email
      const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
      await emailService.sendVerificationEmail(user.email, verificationToken, verificationUrl);

      res.status(200).json({ 
        message: "Verification email sent. Please check your inbox.",
        ...(process.env.NODE_ENV !== 'production' && { devToken: verificationToken })
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ 
        message: "Error sending verification email", 
        error: error.message 
      });
    }
  }

  // Check email verification status
  async checkVerificationStatus(req, res) {
    try {
      const userId = req.user.id;
      const isVerified = await User.isEmailVerified(userId);

      res.status(200).json({ 
        email_verified: isVerified 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error checking verification status", 
        error: error.message 
      });
    }
  }
}

export default new AuthController();