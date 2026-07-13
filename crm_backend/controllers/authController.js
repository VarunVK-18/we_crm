const User = require('../models/User');
const { getNextClientId } = require('../utils/counterHelper');
const Company = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../middleware/rbac');
const Checklist = require('../models/Checklist');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const complianceService = require('../services/complianceService');
const BucketRequest = require('../models/BucketRequest');
const Document = require('../models/Document');
const FilingTask = require('../models/FilingTask');
const ServiceOrder = require('../models/ServiceOrder');
const decodeUtf8 = (str) => {
  if (!str) return str;
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
};

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
      director_count,
      company_id   // company scope passed from admin dashboard
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.trim() });
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

    const creatorId = req.body.created_by || (req.user ? req.user._id : null);

    // Handle uploaded file paths
    let gstin_file = '';
    let pan_file = '';
    if (req.files && req.files.length > 0) {
      const gstinFileObj = req.files.find(f => f.fieldname === 'gstin_file');
      const panFileObj = req.files.find(f => f.fieldname === 'pan_file');
      
      if (gstinFileObj) {
        const doc = await Document.create({
          filename: gstinFileObj.originalname,
          contentType: gstinFileObj.mimetype,
          data: gstinFileObj.buffer,
          uploadedBy: creatorId
        });
        gstin_file = `api/documents/${doc._id}`;
      }
      if (panFileObj) {
        const doc = await Document.create({
          filename: panFileObj.originalname,
          contentType: panFileObj.mimetype,
          data: panFileObj.buffer,
          uploadedBy: creatorId
        });
        pan_file = `api/documents/${doc._id}`;
      }
    }

    const finalCompanyId = req.user ? req.user.company_id : (company_id || null);
    
    // Set onboarding status based on creator role and input
    let onboarding_status = req.body.onboarding_status || 'Prospect';
    if (req.user) {
      if (req.user.role === 'admin') {
        onboarding_status = req.body.onboarding_status || 'Approved';
      } else if (req.user.role === 'client_manager') {
        onboarding_status = req.body.onboarding_status || 'Prospect';
      }
    }

    let initialClientEntities = [];
    if (company_name && company_name.trim() !== '') {
      initialClientEntities.push({
        entityName: company_name.trim(),
        entityType: business_type || 'Company',
        pan: pan || '',
        gstin: gstin || ''
      });
    }

    let custom_client_id = null;
    if (!['admin', 'superadmin', 'client_manager', 'account_manager', 'filling_staff'].includes(role)) {
       try {
         custom_client_id = await getNextClientId(finalCompanyId);
       } catch (e) { console.error('Failed to generate custom_client_id', e); }
    }

    // Create user (password is automatically hashed via mongoose pre-save hook)
    const user = await User.create({
      company_id: finalCompanyId,
      custom_client_id,
      email: email.trim(),
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
      director_count: director_count ? Number(director_count) : 0,
      gstin_file,
      pan_file,
      services: parsedServices || [],
      created_by: creatorId,
      onboarding_status,
      client_entities: initialClientEntities
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

      // Handle serviceName provided by DealVoice Lead conversion or other frontend
      const passedServiceName = req.body.serviceName || req.body.service_name;
      if (passedServiceName && !user.services.includes(passedServiceName)) {
        user.services.push(passedServiceName);
        await user.save();
      }

      // Create Bucket Request for ALL services the user has
      if (user.services && user.services.length > 0) {
        for (const s of user.services) {
          try {
            await BucketRequest.create({
              company_id: user.company_id || '000000000000000000000000',
              client_id: user._id,
              service_name: s,
              status: 'open',
              source: 'we-crm-new',
              client_name: user.owner_name || user.company_name || 'Client',
              client_phone: user.phone || '',
              client_email: user.email,
              client_company_name: user.company_name || ''
            });
            console.log(`Created Bucket Request for newly registered client: ${s}`);
          } catch (e) {
            console.error('Error creating Bucket Request in registerUser:', e);
          }
        }
      }

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
    const user = await User.findOne({ email: email.trim() }).populate('company_id');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If password is not initialized yet (empty string, null/undefined, or not a string)
    if (!user.password || typeof user.password !== 'string' || user.password.trim() === '') {
      user.password = password; // Trigger hashing pre-save hook
      if (req.body.isMobileApp) user.isMobile = true;
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

    // Update isMobile if logged in from the flutter app
    if (req.body.isMobileApp && !user.isMobile) {
      user.isMobile = true;
      await user.save();
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
    const user = await User.findById(req.params.id).select('-password').populate('company_id').populate('assigned_to');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = user.toObject();

    // Explicitly find the Client Manager for this user
    let clientManager = null;

    if (user.created_by) {
      const creator = await User.findById(user.created_by).select('-password');
      if (creator) {
        clientManager = creator.toObject();
      }
    }

    if (!clientManager && user.company_id) {
      const companyId = userObj.company_id._id || userObj.company_id;
      const fallbackManager = await User.findOne({
        company_id: companyId,
        role: 'client_manager'
      }).select('-password');
      
      if (fallbackManager) {
        clientManager = fallbackManager.toObject();
      }
    }

    // Global fallback for testing if no company matched
    if (!clientManager) {
      const globalFallback = await User.findOne({ role: 'client_manager' }).select('-password');
      if (globalFallback) {
        clientManager = globalFallback.toObject();
      }
    }

    userObj.client_manager = clientManager;
    
    // Also find the Admin email for the company
    let adminEmail = 'admin@example.com';
    if (user.company_id) {
      const companyId = userObj.company_id._id || userObj.company_id;
      const adminUser = await User.findOne({ company_id: companyId, role: 'admin' }).select('email');
      if (adminUser) adminEmail = adminUser.email;
    } else {
      const globalAdmin = await User.findOne({ role: 'admin' }).select('email');
      if (globalAdmin) adminEmail = globalAdmin.email;
    }
    userObj.admin_email = adminEmail;

    res.json({
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lightweight client list for dashboard — no per-client stats queries
// @route   GET /api/users/clients/summary
// @access  Private
const getClientsSummary = async (req, res) => {
  try {
    const userCompanyId = req.user ? req.user.company_id : req.query.company_id;
    const filter = { role: 'customer' };
    if (userCompanyId) {
      filter.company_id = userCompanyId;
    }

    if (req.user) {
      const role = req.user.role;
      if (role === 'client_manager') {
        filter.$or = [
          { assigned_to: req.user._id },
          { created_by: req.user._id }
        ];
      } else if (role === 'account_manager' || role === 'filling_staff') {
        filter.assigned_to = req.user._id;
      }
    }

    const clients = await User.find(filter)
      .select('_id custom_client_id owner_name company_name email phone assigned_to created_by')
      .populate('assigned_to', 'owner_name email role')
      .lean();

    res.json({ success: true, clients });
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
      if (role === 'client_manager') {
        // Client Manager: view assigned clients, or clients they created
        filter.$or = [
          { assigned_to: req.user._id },
          { created_by: req.user._id }
        ];
      } else if (role === 'account_manager') {
        // Account Manager: view assigned clients only
        filter.assigned_to = req.user._id;
      } else if (role === 'filling_staff') {
        // Filling Staff: view assigned clients only
        filter.assigned_to = req.user._id;
      }
      // admin sees all clients — no extra filter
    }

    const clients = await User.find(filter)
      .select('-password')
      .populate('assigned_to', 'owner_name email role')
      .lean();

    // Fetch stats and WE services for each client
    for (const client of clients) {
      client.stats = {
        checklists: await Checklist.countDocuments({ client_id: client._id }),
        tasks: await FilingTask.countDocuments({ client_id: client._id }),
        documents: await Document.countDocuments({ uploadedBy: client._id })
      };
      
      const orders = await ServiceOrder.find({ clientUid: client._id.toString() }).select('serviceType status stage');
      const allChecklistsForClient = await Checklist.find({ client_id: client._id }).select('_id service_name status stage').lean();

      client.we_services = orders.map(o => {
        // Find matching checklist
        const matchingChecklist = allChecklistsForClient.find(c => c.service_name === o.serviceType);
        return {
          serviceName: o.serviceType,
          status: matchingChecklist ? matchingChecklist.status : o.status,
          stage: matchingChecklist ? matchingChecklist.stage : o.stage,
          checklistId: matchingChecklist ? matchingChecklist._id : null
        };
      });

      // Add any checklists that were created directly without a matching ServiceOrder
      allChecklistsForClient.forEach(c => {
        if (!client.we_services.find(ws => ws.serviceName === c.service_name)) {
          client.we_services.push({
            serviceName: c.service_name,
            status: c.status,
            stage: c.stage,
            checklistId: c._id
          });
        }
      });
    }

    res.json({
      success: true,
      clients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a service as outsourced for a client
// @route   POST /api/auth/users/clients/:id/outsource-service
// @access  Admin/Client Manager
const outsourceService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName } = req.body;
    
    if (!serviceName) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (!client.outsourced_services) {
      client.outsourced_services = [];
    }

    // Check if already outsourced
    const alreadyOutsourced = client.outsourced_services.some(s => s.serviceName === serviceName);
    if (!alreadyOutsourced) {
      const newOutsourced = { serviceName, markedAt: new Date() };
      await User.updateOne(
        { _id: id }, 
        { $push: { outsourced_services: newOutsourced } }
      );
      client.outsourced_services.push(newOutsourced); // update local copy for response
    }

    res.json({ success: true, outsourced_services: client.outsourced_services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register employee directly — scoped to a company
// @route   POST /api/auth/register-direct
// @access  Public (should be restricted in production)
const registerDirect = async (req, res) => {
  try {
    const { name, email, password, role, company_id, phone } = req.body;
    let user = await User.findOne({ email: email.trim() });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Validate role — only these three staff roles are allowed
    const allowedRoles = ['client_manager', 'filling_staff', 'account_manager'];
    const assignedRole = allowedRoles.includes(role) ? role : 'client_manager';

    const finalCompanyId = req.user ? req.user.company_id : (company_id || null);
    user = new User({ 
      owner_name: name, 
      email: email.trim(), 
      phone: phone ? phone.trim() : undefined,
      password: password || 'Default@123', 
      role: assignedRole,
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

    const ServiceOrder = require('../models/ServiceOrder');

    const users = await User.find(filter).select('owner_name email role phone company_id');
    
    const groupsObj = users.reduce((acc, user) => {
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
        phone: user.phone,
        role: user.role,
        ongoingTasksCount: 0 // Default to 0, will update for filling_staff
      });
      return acc;
    }, {});

    // For filling_staff, accurately count their ongoing ServiceOrders from DB
    if (groupsObj['filling_staff'] && groupsObj['filling_staff'].members) {
      for (const member of groupsObj['filling_staff'].members) {
        const count = await ServiceOrder.countDocuments({
          assignedExpert: member.name,
          status: { $ne: 'complete' }
        });
        member.ongoingTasksCount = count;
      }
    }

    res.status(200).json(Object.values(groupsObj));
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
    const { name, email, role, phone } = req.body;
    const updateData = { 
      owner_name: name, 
      email: email.trim(), 
      role 
    };
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }
    
    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

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
    const emailExists = await User.findOne({ email: email.trim() });
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
      email: email.trim(),
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

    // Cascade the staff assignment to all active checklists for this client
    try {
      await Checklist.updateMany(
        { client_id: id, status: { $ne: 'completed' } },
        { $set: { assigned_to: client.assigned_to } }
      );
    } catch (e) {
      console.error('Error cascading assignment to checklists:', e);
    }

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

const toggleComplianceRadar = async (req, res) => {
  try {
    const { id } = req.params;
    const { in_compliance_radar } = req.body;
    
    if (in_compliance_radar === undefined) {
      return res.status(400).json({ success: false, message: 'in_compliance_radar field is required' });
    }

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.in_compliance_radar = in_compliance_radar;
    await client.save();

    if (req.user) {
      await logActivity(
        req.user._id,
        'compliance_radar_toggle',
        `${in_compliance_radar ? 'Enabled' : 'Disabled'} compliance radar for client '${client.owner_name}'`,
        req.user.company_id
      );
    }

    res.status(200).json({ success: true, message: 'Compliance radar setting updated successfully', in_compliance_radar: client.in_compliance_radar });
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

const savePanDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.panNumber) user.pan = req.body.panNumber;
    if (req.body.name) user.pan_name = req.body.name;
    if (req.body.fatherName) user.pan_father_name = req.body.fatherName;
    if (req.body.dob) user.pan_dob = req.body.dob;

    if (req.file) {
      const doc = await Document.create({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer,
        uploadedBy: user._id
      });
      user.pan_file = `api/documents/${doc._id}`;
      
      // Remove previous PAN verification doc if any
      user.onboarding_documents = user.onboarding_documents.filter(d => d.name !== 'PAN Card Verification');
      
      user.onboarding_documents.push({
        name: 'PAN Card Verification',
        fileUrl: `api/documents/${doc._id}`
      });
    }

    await user.save();
    res.status(200).json({ success: true, message: 'PAN details saved successfully', pan: user.pan, pan_file: user.pan_file });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const subscribeService = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceName = decodeUtf8(req.body.serviceName || req.body.service_name);
    const dealClosedAmount = req.body.dealClosedAmount || req.body.deal_closed_amount;

    if (!serviceName) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Save/update editable user details if provided in request body, but only if they are not already set
    // This prevents renaming the user's primary company when they register a new entity.
    if (req.body.owner_name && !user.owner_name) user.owner_name = req.body.owner_name;
    // Do not blindly overwrite email
    if (req.body.phone && !user.phone) user.phone = req.body.phone;
    if (req.body.company_name && (!user.company_name || user.company_name.trim() === '')) {
      user.company_name = req.body.company_name;
    }
    
    const requestedEntityName = req.body.entity_name || req.body.company_name || user.company_name || user.owner_name || 'Client';

    // If the user submitted a new entity name, add it to their client_entities if it doesn't exist yet.
    // EXCEPTION: Incorporation services — entity is only created after the COI document is uploaded
    // and the company name is extracted via OCR. Creating it here would cause a premature/duplicate entity.
    const isIncorporationService = serviceName && (
      serviceName.includes('Incorporation') || 
      serviceName.includes('One Person Company') || 
      serviceName.includes('Proprietorship')
    );
    if (req.body.entity_name && !isIncorporationService) {
      const entityAlreadyExists = (user.client_entities || []).some(
        (e) => e.entityName && e.entityName.toLowerCase() === req.body.entity_name.toLowerCase()
      );
      if (!entityAlreadyExists) {
        if (!user.client_entities) user.client_entities = [];
        user.client_entities.push({ entityName: req.body.entity_name });
        console.log(`[subscribeService] Created new entity '${req.body.entity_name}' for user ${user._id}`);
      }
    }

    if (dealClosedAmount) {
      user.revenue = (user.revenue || 0) + Number(dealClosedAmount);
    }

    let isNewSubscription = false;
    if (!user.services.includes(serviceName)) {
      user.services.push(serviceName);
      isNewSubscription = true;
    }

    // Process uploaded document files if present in request
    const orderDocuments = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        // Clean duplicate documents with the same name if user uploads them again
        const docName = `${serviceName} - ${f.fieldname}`;
        user.onboarding_documents = user.onboarding_documents.filter(d => d.name !== docName);
        
        const doc = await Document.create({
          filename: f.originalname,
          contentType: f.mimetype,
          data: f.buffer,
          uploadedBy: user._id
        });

        user.onboarding_documents.push({
          name: docName,
          fileUrl: `api/documents/${doc._id}`
        });

        orderDocuments.push({
          name: f.fieldname,
          filename: f.originalname,
          fileUrl: `api/documents/${doc._id}`
        });
      }
    }

    await user.save();

    const existingChecklist = await Checklist.findOne({
      client_id: user._id,
      service_name: serviceName,
      'details.entityName': requestedEntityName,
      status: { $ne: 'completed' }
    });

    if (existingChecklist) {
      return res.status(409).json({ success: false, message: 'Service request already done wait for manager approval' });
    }

    if (isNewSubscription || !existingChecklist) {

      // Create a Checklist for this service automatically
      let finalItems = [];
      try {
        const template = await ChecklistTemplate.findOne({
          company_id: user.company_id,
          service_name: serviceName
        });

        if (template && template.items && template.items.length > 0) {
          finalItems = template.items.map(item => ({
            title: item.title,
            description: item.description,
            staff_description: item.staff_description || '',
            label: item.title,
            isChecked: false
          }));
        }

        // Enforce "Client Form Filling" as the first step for all checklists
        if (finalItems.length === 0 || finalItems[0].title !== 'Client Form Filling') {
          finalItems.unshift({
            title: 'Client Form Filling',
            description: 'Ensure the client has submitted all necessary initial forms and details.',
            label: 'Client Form Filling',
            isChecked: false
          });
        }
        if (finalItems.length === 1) {
          finalItems.push({ 
            title: 'Final Delivery & Processing', 
            description: 'Process the service and upload final documents.', 
            label: 'Service Processing', 
            isChecked: false 
          });
        }

        // Parse details field if present
        let details = {};
        if (req.body.details) {
          try {
            details = typeof req.body.details === 'string' ? JSON.parse(req.body.details) : req.body.details;
          } catch (e) {
            console.error('Error parsing details JSON:', e);
          }
        }
        details.entityName = requestedEntityName;

        let calculatedPlan = '';
        let calculatedFee = 0;
        if (details.turnoverCategory) {
          const tc = details.turnoverCategory.toLowerCase();
          if (tc.includes('below') || tc.includes('less than ₹20') || tc.includes('less than 20')) {
            calculatedPlan = 'Basic Plan';
            calculatedFee = 25000;
          } else if (tc.includes('greater than ₹20') || tc.includes('between')) {
            calculatedPlan = 'Business Plan';
            calculatedFee = 35000;
          } else if (tc.includes('above') || tc.includes('greater than ₹50')) {
            calculatedPlan = 'Corporate Plan';
            calculatedFee = 50000;
          }
        }
        
        details.recommended_plan = calculatedPlan;
        details.service_fee = calculatedFee;

        // Create a Bucket Request instead of a direct Checklist


        // Create a Bucket Request ONLY if the client does not have a personal manager yet
        let managerName = 'To be assigned';
        let managerPhone = '';

        if (!user.assigned_to) {
          const existingBucketReq = await BucketRequest.findOne({
            company_id: user.company_id,
            client_id: user._id,
            service_name: serviceName,
            status: { $in: ['open', 'claimed_by_manager', 'assigned'] }
          });

          if (!existingBucketReq) {
            await BucketRequest.create({
              company_id: user.company_id || '000000000000000000000000',
              client_id: user._id,
              service_name: serviceName,
              status: 'open',
              source: 'we-crm',
              client_name: requestedEntityName,
              client_phone: user.phone || '',
              client_email: user.email,
              client_company_name: user.company_name || ''
            });
            console.log(`Created open Bucket Request for unassigned client: ${serviceName}`);
          }
        } else {
          const manager = await User.findById(user.assigned_to);
          if (manager) {
            managerName = manager.owner_name || manager.email;
            managerPhone = manager.phone || '';

            // Map turnoverCategory to Checklist valid enum if present
            let checklistTurnover = '';
            if (details.turnoverCategory) {
              const tc = details.turnoverCategory.toLowerCase();
              if (tc.includes('below') || tc.includes('less than ₹20') || tc.includes('less than 20')) {
                checklistTurnover = 'Less than ₹20 Lakhs';
              } else if (tc.includes('greater than ₹20') || tc.includes('between')) {
                checklistTurnover = 'Greater than ₹20 Lakhs and Less than ₹50 Lakhs';
              } else if (tc.includes('above') || tc.includes('greater than ₹50')) {
                checklistTurnover = 'Greater than ₹50 Lakhs';
              }
            }
            
            await Checklist.create({
              company_id: user.company_id || '000000000000000000000000',
              client_id: user._id,
              service_name: serviceName,
              assigned_to: null, // Set to null ("Yet to Assign") instead of manager._id
              created_by: manager._id,
              items: finalItems,
              details: details,
              status: 'pending',
              stage: 'quotePending',
              action_required: true,
              recommended_plan: calculatedPlan,
              recommended_fee: calculatedFee,
              turnover_category: checklistTurnover
            });
            console.log(`Auto-created Checklist for ${serviceName} assigned to existing manager ${managerName}`);
          }
        }

        // Also create a ServiceOrder so it appears in the New Requests page
        await ServiceOrder.create({
          clientUid: user._id.toString(),
          companyId: user.company_id,
          entityName: requestedEntityName,
          serviceType: serviceName,
          status: 'active',
          stage: 'reqReceived',
          assignedExpert: managerName,
          expertPhone: managerPhone,
          documents: orderDocuments,
          details: details,
          steps: finalItems, // Assuming orderSteps was renamed or using finalItems
          turnover_category: details.turnoverCategory || '',
          recommended_plan: calculatedPlan,
          service_fee: calculatedFee
        });
        console.log(`Created ServiceOrder for ${serviceName} — visible in New Requests`);
      } catch (e) {
        console.error('Error creating Bucket Request automatically:', e);
      }

      await logActivity(
        user._id,
        'Client Subscribed to Service',
        `User registered to service: ${serviceName}`,
        user.company_id || null
      );
    }

    res.status(200).json({ success: true, services: user.services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Migrate: re-assign pending checklists owned by filing_staff to client_manager
// @route   POST /api/admin/migrate-checklist-assignments
// @access  Private (Admin only)
const migrateChecklistAssignments = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    let fixed = 0;
    let skipped = 0;

    // Get all pending checklists for this company
    const pendingChecklists = await Checklist.find({
      company_id: companyId,
      status: { $ne: 'completed' }
    }).populate('assigned_to', 'role _id owner_name');

    for (const checklist of pendingChecklists) {
      // Skip if already assigned to a non-filing-staff person
      if (checklist.assigned_to && checklist.assigned_to.role !== 'filling_staff') {
        skipped++;
        continue;
      }

      // Find the client who owns this checklist
      const client = await User.findById(checklist.client_id).select('created_by company_id assigned_to');
      if (!client) { skipped++; continue; }

      let newAssignee = null;

      // Priority 1: Client manager who created this client
      if (client.created_by) {
        const creator = await User.findById(client.created_by).select('_id role');
        if (creator && creator.role === 'client_manager') {
          newAssignee = creator._id;
        }
      }

      // Priority 2: Any client_manager in the same company
      if (!newAssignee) {
        const mgr = await User.findOne({ company_id: companyId, role: 'client_manager' }).select('_id');
        if (mgr) newAssignee = mgr._id;
      }

      if (newAssignee) {
        await Checklist.findByIdAndUpdate(checklist._id, { assigned_to: newAssignee });
        fixed++;
      } else {
        skipped++;
      }
    }

    await logActivity(
      req.user._id,
      'checklist_migration',
      `Migrated ${fixed} checklists from filing_staff to client_manager. Skipped: ${skipped}`,
      companyId
    );

    res.status(200).json({
      success: true,
      message: `Migration complete. Fixed: ${fixed}, Skipped: ${skipped}.`
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const User = require('../models/User');
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No image file uploaded' });

    const Document = require('../models/Document');
    const doc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: user._id
    });

    user.profile_image = `api/documents/${doc._id}`;
    await user.save();

    res.status(200).json({ success: true, message: 'Profile image uploaded successfully', profile_image: user.profile_image });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const User = require('../models/User');
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profile_image = '';
    await user.save();

    res.status(200).json({ success: true, message: 'Profile image removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update client entities array
// @route   PUT /api/users/profile/:id/entities
// @access  Private
const updateClientEntities = async (req, res) => {
  try {
    const { id } = req.params;
    const { client_entities } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.client_entities = client_entities || [];
    await user.save();

    if (req.user) {
      await logActivity(
        req.user._id,
        'client_entities_update',
        `Updated entities list for client: ${user.owner_name} (${user.email}). Total entities: ${user.client_entities.length}`,
        req.user.company_id
      );
    }

    res.status(200).json({ success: true, message: 'Client entities updated successfully', client_entities: user.client_entities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPublicManagers = async (req, res) => {
  try {
    const { company_id } = req.query;
    const managers = await User.find({ role: 'client_manager', company_id }).select('_id owner_name email');
    res.status(200).json(managers);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching managers' });
  }
};

// Client self-editing profile
const editClientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure the user is only editing their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this profile.' });
    }

    const { company_name, owner_name, email, phone, business_type, address, directors } = req.body;
    
    // Only update allowed fields
    const user = await User.findByIdAndUpdate(id, {
      company_name,
      owner_name,
      email,
      phone,
      business_type,
      address,
      ...(directors !== undefined && { directors })
    }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error while updating profile.' });
  }
};

// Upload document for a specific director
const uploadDirectorDocument = async (req, res) => {
  try {
    const { id, index } = req.params;
    const { docType } = req.body; // 'photo' or 'signature'
    
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    if (docType !== 'photo' && docType !== 'signature') {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const dirIndex = parseInt(index, 10);
    if (isNaN(dirIndex) || dirIndex < 0 || dirIndex >= user.directors.length) {
      return res.status(400).json({ success: false, message: 'Invalid director index.' });
    }

    const doc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: user._id
    });

    const fileUrl = `api/documents/${doc._id}`;
    
    // Update the specific director's document
    user.directors[dirIndex][docType] = fileUrl;
    
    // Mark the array as modified so Mongoose saves the subdocument changes
    user.markModified('directors');
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `${docType} uploaded successfully.`, 
      user,
      fileUrl
    });
  } catch (error) {
    console.error('Error uploading director document:', error);
    res.status(500).json({ success: false, message: 'Server error while uploading document.' });
  }
};

// Reupload document for a specific client profile document
const reuploadProfileDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType } = req.body; 

    // We allow admins, managers, staff, or the user themselves to edit this
    const allowedRoles = ['admin', 'account_manager', 'client_manager', 'filling_staff'];
    if (req.user._id.toString() !== id && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    if (!docType) {
      return res.status(400).json({ success: false, message: 'Document type is required.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const doc = await Document.create({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      uploadedBy: req.user._id
    });

    const fileUrl = `api/documents/${doc._id}`;
    
    if (docType === 'pan_file') {
      user.pan_file = fileUrl;
    } else if (docType === 'gstin_file') {
      user.gstin_file = fileUrl;
    } else {
      // Must be an "onboarding_documents" item by name
      const otherDocIndex = user.onboarding_documents.findIndex(d => d.name === docType);
      if (otherDocIndex >= 0) {
        user.onboarding_documents[otherDocIndex].fileUrl = fileUrl;
      } else {
        user.onboarding_documents.push({ name: docType, fileUrl: fileUrl, uploadedAt: new Date() });
      }
      user.markModified('onboarding_documents');
    }
    
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `${docType} updated successfully.`, 
      user,
      fileUrl
    });
  } catch (error) {
    console.error('Error reuploading profile document:', error);
    res.status(500).json({ success: false, message: 'Server error while reuploading document.' });
  }
};

// @desc    Onboard external client via OCR data
// @route   POST /api/users/clients/external-onboard
// @access  Private (Admin/Manager)
const externalOnboard = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      companyName,
      companyPhone,
      companyEmail,
      incorporationDate,
      cinNumber,
      pan,
      tan,
      clientPassword,
      assignedTo,
      entityType
    } = req.body;

    if (!clientEmail || !companyName) {
      return res.status(400).json({ success: false, message: 'Client Email and Company Name are required.' });
    }

    // 1. Handle COI file upload
    let documentId = null;
    let fileUrl = null;
    if (req.file) {
      const doc = await Document.create({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer,
        uploadedBy: req.user._id
      });
      documentId = doc._id;
      fileUrl = `api/documents/${doc._id}`;
    }

    // 2. Generate random password if not provided by Manager
    const plainPassword = clientPassword || (Math.random().toString(36).slice(-10) + 'A1!');

    // 3. Create or find User
    const normalizedEmail = clientEmail.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    
    // Create new entity
    const parsedEntityType = entityType || 'Private Limited Company';
    const newEntity = {
      entity_name: companyName.trim(),
      type: parsedEntityType,
      status: 'Active',
      incorporation_date: incorporationDate || null
    };

    if (!user) {
      // Get the next sequential ID
      const custom_client_id = await getNextClientId(req.user.company_id);
      
      user = await User.create({
        company_id: req.user.company_id,
        custom_client_id,
        email: normalizedEmail,
        password: plainPassword,
        owner_name: clientName || '',
        phone: companyPhone || '',
        role: 'customer',
        company_name: companyName.trim(),
        pan: pan || '',
        status: 'active',
        created_by: req.user._id,
        assigned_to: assignedTo || null,
        onboarding_status: 'Approved',
        in_compliance_radar: true, // Automatically enable compliance radar
        client_entities: [newEntity]
      });
    } else {
      // Append entity if user exists
      user.client_entities.push(newEntity);
      user.in_compliance_radar = true;
      await user.save();
    }

    // Calculate next ROC compliance date (typically Sept 30 of the following financial year)
    let expiryDate = new Date();
    if (incorporationDate) {
      const incDate = new Date(incorporationDate);
      // Rough estimation: next year's Sept 30
      expiryDate = new Date(incDate.getFullYear() + 1, 8, 30);
      if (expiryDate < new Date()) {
        expiryDate = new Date(new Date().getFullYear() + 1, 8, 30); // push to next year if already passed
      }
    } else {
      expiryDate = new Date(new Date().getFullYear() + 1, 8, 30);
    }

    // 4. Create a dummy "Completed" Checklist to feed the Compliance Radar
    const checklist = await Checklist.create({
      company_id: req.user.company_id,
      client_id: user._id,
      service_name: 'Incorporation (External)',
      assigned_to: assignedTo || req.user._id,
      created_by: req.user._id,
      status: 'completed',
      completion_percentage: 100,
      startedAt: new Date(),
      completedAt: new Date(),
      items: [],
      final_documents: fileUrl ? [{
        document_id: documentId,
        name: 'Certificate of Incorporation (External)',
        fileUrl: fileUrl,
        uploadedAt: new Date(),
        expiry_date: expiryDate
      }] : []
    });

    // 5. Generate Compliance Tasks based on Entity Type
    if (incorporationDate) {
      try {
        const incDateObj = new Date(incorporationDate);
        if (parsedEntityType === 'LLP') {
          await complianceService.generateCompliancesForLLP(
            user._id, req.user.company_id, checklist._id, incDateObj, companyName.trim()
          );
        } else if (parsedEntityType === 'OPC') {
          await complianceService.generateCompliancesForOPC(
            user._id, req.user.company_id, checklist._id, incDateObj, companyName.trim()
          );
        } else if (parsedEntityType === 'Private Limited Company') {
          await complianceService.generateCompliancesForPrivateLimited(
            user._id, req.user.company_id, checklist._id, incDateObj, companyName.trim()
          );
        }
        // Proprietorship typically does not have standard ROC compliance in the same manner.
      } catch (err) {
        console.error('Error generating compliances:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: 'External client onboarded and compliance activated.',
      user: {
        email: user.email,
        generatedPassword: plainPassword // In production, this should ideally be emailed via a mailing service
      },
      checklistId: checklist._id
    });
  } catch (error) {
    console.error('External Onboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getClients,
  getClientsSummary,
  outsourceService,
  registerDirect,
  getTeamGroups,
  deleteUser,
  editUser,
  resetPassword,
  registerCompany,
  assignClient,
  approveClient,
  getAuditLogs,
  subscribeService,
  savePanDetails,
  migrateChecklistAssignments,
  uploadProfileImage,
  removeProfileImage,
  updateClientEntities,
  getPublicManagers,
  editClientProfile,
  uploadDirectorDocument,
  toggleComplianceRadar,
  reuploadProfileDocument,
  externalOnboard
};
