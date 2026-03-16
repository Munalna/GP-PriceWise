import * as userModel from '../models/userModel.js';

// @desc    Sign up new user
// @route   POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and business name'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    const result = await userModel.signUpUser(email, password, businessName);

    return res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify.',
      data: {
        user: result.user,
        session: result.session
      }
    });
  } catch (error) {
    if (error.message && error.message.includes('already registered')) {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered'
      });
    }

    console.error('Signup error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const result = await userModel.loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        session: result.session
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid email or password'
    });
  }
};