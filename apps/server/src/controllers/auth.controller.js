import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  const refreshToken = jwt.sign({ userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const user = await User.create({ firstName, lastName, email: email.toLowerCase().trim(), password });
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({ ...tokens, user: user.toPublic() });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({ ...tokens, user: user.toPublic() });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json(tokens);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user.toPublic());
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { refreshToken: null });
    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Forgot Password ─────────────────────────────────────────────────
// Generates a 6-digit code, stores it on the user, returns it
// In production: send this via email (SendGrid, Resend, etc.)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't reveal if email exists — always return success
      return res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    // TODO: Send email with code in production
    // For dev: log it
    console.log(`🔑 Reset code for ${email}: ${code}`);

    res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('ForgotPassword error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Reset Password ──────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetCode: code,
      resetCodeExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    console.error('ResetPassword error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
