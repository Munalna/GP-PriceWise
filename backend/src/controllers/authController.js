import * as userModel from '../models/userModel.js';

// @desc    Sign up new user
// @route   POST /api/auth/signup
export const signup = async (req, res, next) => {
  try {
    const { email, password, businessName } = req.body;

    // Validate input
    if (!email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and business name'
      });
    }

    // Check password length
if (password.length < 8) {
  return res.status(400).json({
    success: false,
    error: 'Password must be at least 8 characters'
  });
}

    // Create user
    const result = await userModel.signUpUser(email, password, businessName);

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify.',
      data: {
        user: result.user,
        session: result.session
      }
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.message && error.message.includes('already registered')) {
      return res.status(400).json({
        success: false,
        error: 'This email is already registered'
      });
    }
    
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account'
    });
  }
};