import * as userModel from '../models/userModel.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildDefaultRedirectTo = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl.replace(/\/$/, '')}/reset-password`;
};

// @desc    Sign up new user
// @route   POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and business name',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    const result = await userModel.signUpUser(email, password, businessName);

    return res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify.',
      data: {
        user: result.user,
        session: result.session,
      },
    });
  } catch (error) {
    if (error.message && error.message.includes('already registered')) {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered',
      });
    }

    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account',
    });
  }
};

// @desc    Request password reset email/link
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email, redirectTo } = req.body;

  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required',
    });
  }

  const safeRedirectTo =
    typeof redirectTo === 'string' && redirectTo.trim()
      ? redirectTo.trim()
      : buildDefaultRedirectTo();

  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email.trim(),
        options: {
          redirectTo: safeRedirectTo,
        },
      });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        message:
          'Recovery link generated with Admin API. Send data.actionLink using your own email provider.',
        mode: 'admin-generate-link',
        redirectTo: safeRedirectTo,
        actionLink:
          process.env.NODE_ENV === 'production'
            ? undefined
            : data?.properties?.action_link || null,
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: safeRedirectTo,
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'If this email exists, a reset link has been sent.',
      mode: 'supabase-email',
      redirectTo: safeRedirectTo,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to request password reset',
    });
  }
};

// @desc    Explain why reset password is frontend recovery flow
// @route   POST /api/auth/reset-password
export const resetPasswordInfo = async (req, res) => {
  return res.status(400).json({
    success: false,
    error:
      'Password update must be completed from the frontend recovery session at /reset-password.',
    hint:
      'Use supabase.auth.updateUser({ password: newPassword }) after the user opens the recovery link from email.',
  });
};
