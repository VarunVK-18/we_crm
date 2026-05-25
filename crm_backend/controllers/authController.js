const User = require('../models/User');
const Company = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../middleware/rbac');

// @desc    Register a new user (client) — scoped to a company
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
      revenue,
      company_id   // company scope passed from admin dashboard
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

    const finalCompanyId = req.user ? req.user.company_id : (company_id || null);
    const creatorId = req.user ? req.user._id : null;
    
    // Set onboarding status based on creator role and input
    let onboarding_status = req.body.onboarding_status || 'Prospect';
    if (req.user) {
      if (req.user.role === 'admin') {
        onboarding_status = req.body.onboarding_status || 'Approved';
      } else if (req.user.role === 'account_manager') {
        onboarding_status = req.body.onboarding_status || 'Pending Verification';
      }
    }

    // Create user (password is automatically hashed via mongoose pre-save hook)
    const user = await User.create({
      company_id: finalCompanyId,
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
      services: parsedServices || [],
      created_by: creatorId,
      onboarding_status
    });

    if (user) {
      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      // Log the registration action
      const performer = req.user ? req.user._id : user._id;
      const performerCompany = req.user ? req.user.company_id : user.company_id;
      await logActivity(
        performer,
        'client_registration',
        `Registered client account: ${user.owner_name} (${user.email}) with onboarding status: ${onboarding_status}`,
        performerCompany
      );

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

    // Find user by email, populate company details
    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('company_id');
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
    const user = await User.findById(req.params.id).select('-password').populate('company_id');
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

const getClients = async (req, res) => {
  try {
    const userCompanyId = req.user ? req.user.company_id : req.query.company_id;
    const filter = { role: 'customer' };
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    // Apply role-based client listing scoping
    if (req.user) {
      const role = req.user.role;
      if (role === 'account_manager') {
        // Account Manager: view assigned clients only
        filter.assigned_to = req.user._id;
      } else if (role === 'sales_staff' || role === 'agent') {
        // Sales Staff & Agent: view own clients only
        filter.created_by = req.user._id;
      } else if (role === 'filling_staff') {
        // Filling Staff: view assigned clients only
        filter.assigned_to = req.user._id;
      }
    }

    const clients = await User.find(filter)
      .select('-password')
      .populate('assigned_to', 'owner_name email role');
    res.json({
      success: true,
      clients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register employee directly — scoped to a company
// @route   POST /api/auth/register-direct
// @access  Public (should be restricted in production)
const registerDirect = async (req, res) => {
  try {
    const { name, email, password, role, company_id } = req.body;
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const finalCompanyId = req.user ? req.user.company_id : (company_id || null);
    user = new User({ 
      owner_name: name, 
      email: email.toLowerCase().trim(), 
      password: password || 'Default@123', 
      role: role || 'agent',
      company_id: finalCompanyId
    });
    await user.save();

    if (req.user) {
      await logActivity(
        req.user._id,
        'employee_creation',
        `Registered new employee: ${user.owner_name} (${user.email}) with role: ${user.role}`,
        req.user.company_id
      );
    }

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get team groups of employees — scoped by company_id
// @route   GET /api/users/team-groups?company_id=<id>
// @access  Public
const getTeamGroups = async (req, res) => {
  try {
    const { company_id } = req.query;
    const filter = { role: { $ne: 'customer' } };
    if (company_id) {
      filter.company_id = company_id;
    }

    const users = await User.find(filter).select('owner_name email role company_id');
    
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
    const deletedUser = await User.findByIdAndDelete(id);
    if (deletedUser && req.user) {
      await logActivity(
        req.user._id,
        'employee_deletion',
        `Removed employee: ${deletedUser.owner_name} (${deletedUser.email})`,
        req.user.company_id
      );
    }
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

    if (user && req.user) {
      await logActivity(
        req.user._id,
        'employee_edit',
        `Updated details of employee: ${user.owner_name} (${user.email}) to role: ${user.role}`,
        req.user.company_id
      );
    }

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

    if (req.user) {
      await logActivity(
        req.user._id,
        'employee_password_reset',
        `Reset password of employee: ${user.owner_name} (${user.email}) to default`,
        req.user.company_id
      );
    }

    res.status(200).json({ success: true, message: 'Password reset to default' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new company + create admin account
// @route   POST /api/auth/register-company
// @access  Public
const registerCompany = async (req, res) => {
  try {
    const {
      company_code,
      company_name,
      gstin,
      owner_name,
      email,
      password,
      phone,
      address
    } = req.body;

    // Validate required fields
    if (!company_code || !company_name || !owner_name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields (Company Code, Company Name, Owner Name, Email, Password)' });
    }

    const codeUpper = company_code.toUpperCase().trim();

    // Check if company code already exists
    const companyExists = await Company.findOne({ company_code: codeUpper });
    if (companyExists) {
      return res.status(400).json({ message: `A company with code "${codeUpper}" is already registered` });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }

    // Step 1: Create the Company document
    const company = await Company.create({
      company_code: codeUpper,
      company_name,
      gstin: gstin || '',
      phone: phone || '',
      address: address || '',
      status: 'active'
    });

    // Step 2: Create the admin User linked to this company
    const user = await User.create({
      company_id: company._id,
      company_code: codeUpper,
      company_name,
      gstin: gstin || '',
      owner_name,
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      address: address || '',
      role: 'admin',
      status: 'active'
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    // Attach company object so the frontend has full context
    userResponse.company_id = company.toObject();

    res.status(201).json({
      message: 'Company registered successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign client to an employee (Account Manager or Filling Staff)
// @route   PATCH /api/users/clients/:id/assign
// @access  Private (Admin, Account Manager)
const assignClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    let employeeName = 'None';
    if (employee_id) {
      const employee = await User.findById(employee_id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      employeeName = employee.owner_name;
      client.assigned_to = employee_id;
    } else {
      client.assigned_to = null;
    }

    await client.save();

    if (req.user) {
      await logActivity(
        req.user._id,
        'client_assigned',
        `Assigned client '${client.owner_name}' to employee '${employeeName}'`,
        req.user.company_id
      );
    }

    res.status(200).json({ success: true, message: 'Client assigned successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client onboarding status (onboarding workflow)
// @route   PATCH /api/users/clients/:id/onboarding
// @access  Private (Admin, Account Manager, Sales Staff, Agent)
const approveClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { onboarding_status } = req.body;

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const oldStatus = client.onboarding_status;
    client.onboarding_status = onboarding_status;
    await client.save();

    if (req.user) {
      await logActivity(
        req.user._id,
        'onboarding_status_update',
        `Transitioned client '${client.owner_name}' onboarding status from '${oldStatus}' to '${onboarding_status}'`,
        req.user.company_id
      );
    }

    res.status(200).json({ success: true, message: 'Client onboarding status updated successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin, Auditor)
const getAuditLogs = async (req, res) => {
  try {
    const userCompanyId = req.user.company_id;
    const filter = {};
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    const logs = await AuditLog.find(filter)
      .populate('performed_by', 'owner_name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const subscribeService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName } = req.body;

    if (!serviceName) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.services.includes(serviceName)) {
      user.services.push(serviceName);
      await user.save();

      await logActivity(
        user._id,
        'Client Subscribed to Service',
        `User registered to service: ${serviceName}`,
        req.ip
      );
    }

    res.status(200).json({ success: true, services: user.services });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  resetPassword,
  registerCompany,
  assignClient,
  approveClient,
  getAuditLogs,
  subscribeService
};
