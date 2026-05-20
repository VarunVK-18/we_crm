const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      owner_name, 
      phone, 
      role, 
      company_name, 
      services,
      business_type,
      pan,
      gstin,
      address,
      status,
      revenue
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    // Safely parse services array (which might be sent as JSON string in multipart form data)
    let parsedServices = services;
    if (typeof services === 'string') {
      try {
        parsedServices = JSON.parse(services);
      } catch (e) {
        parsedServices = services.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Handle uploaded file paths
    let gstin_file = '';
    let pan_file = '';
    if (req.files && req.files.length > 0) {
      const gstinFileObj = req.files.find(f => f.fieldname === 'gstin_file');
      const panFileObj = req.files.find(f => f.fieldname === 'pan_file');
      
      if (gstinFileObj) {
        gstin_file = `uploads/${gstinFileObj.filename}`;
      }
      if (panFileObj) {
        pan_file = `uploads/${panFileObj.filename}`;
      }
    }

    // Create user (password is automatically hashed via mongoose pre-save hook)
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: password || '',
      owner_name,
      phone: phone || '',
      role: role || 'customer',
      company_name: company_name || '',
      business_type: business_type || '',
      pan: pan || '',
      gstin: gstin || '',
      address: address || '',
      status: status || 'active',
      revenue: revenue ? Number(revenue) : 0,
      gstin_file,
      pan_file,
      services: parsedServices || []
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
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If password is not initialized yet (empty string, null/undefined, or not a string)
    if (!user.password || typeof user.password !== 'string' || user.password.trim() === '') {
      user.password = password; // Trigger hashing pre-save hook
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.json({
        message: 'Password set successfully. Login successful!',
        user: userResponse
      });
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

// @desc    Get all client users (role = 'customer')
// @route   GET /api/users/clients
// @access  Public
const getClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'customer' }).select('-password');
    res.json({
      success: true,
      clients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register employee directly
// @route   POST /api/auth/register-direct
// @access  Public (should be restricted in production)
const registerDirect = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = new User({ 
      owner_name: name, 
      email: email.toLowerCase().trim(), 
      password: password || 'Default@123', 
      role: role || 'agent' 
    });
    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team groups of employees
// @route   GET /api/users/team-groups
// @access  Public
const getTeamGroups = async (req, res) => {
  try {
    // Exclude role = 'customer' from team groups as customers are clients
    const users = await User.find({ role: { $ne: 'customer' } }).select('owner_name email role');
    
    // Group users by role
    const groups = users.reduce((acc, user) => {
      const role = user.role || 'agent';
      if (!acc[role]) {
        acc[role] = {
          name: role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          members: []
        };
      }
      acc[role].members.push({
        id: user._id,
        name: user.owner_name,
        email: user.email,
        role: user.role
      });
      return acc;
    }, {});

    res.status(200).json(Object.values(groups));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/delete_user/:id
// @access  Public
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit employee details
// @route   PATCH /api/edit_user/:id
// @access  Public
const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(id, { 
      owner_name: name, 
      email: email.toLowerCase().trim(), 
      role 
    }, { new: true });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset employee password
// @route   POST /api/reset-password/:id
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.password = 'Default@123';
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset to default' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getClients,
  registerDirect,
  getTeamGroups,
  deleteUser,
  editUser,
  resetPassword
};
