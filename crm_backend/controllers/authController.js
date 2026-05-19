const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, owner_name, phone, role, company_name, services } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    // Create user (password is automatically hashed via mongoose pre-save hook)
    const user = await User.create({
      email,
      password,
      owner_name,
      phone,
      role: role || 'customer',
      company_name: company_name || '',
      services: services || []
    });

    if (user) {
      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        message: 'Registration successful',
        user: userResponse
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Remove password from response object
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
