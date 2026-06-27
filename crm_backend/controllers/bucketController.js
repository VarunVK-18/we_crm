const BucketRequest = require('../models/BucketRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const Checklist = require('../models/Checklist');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const { logActivity } = require('../middleware/rbac');

// @desc    Get all OPEN bucket requests (for client_managers)
// @route   GET /api/bucket/requests
const getBucketRequests = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { status = 'open' } = req.query;

    const filter = { company_id };
    if (status === 'all') {
      filter.$or = [
        { status: { $ne: 'open' } },
        { status: 'open', source: { $in: ['dealvoice', 'we-crm-old', 'manual', 'we-crm'] } }
      ];
    } else if (status === 'open') {
      filter.status = 'open';
      filter.source = { $in: ['dealvoice', 'we-crm-old', 'manual', 'we-crm'] };
    } else {
      filter.status = status;
    }

    const requests = await BucketRequest.find(filter)
      .populate('client_id', 'owner_name email phone company_name')
      .populate('claimed_by', 'owner_name email _id')
      .populate('assigned_to', 'owner_name email _id')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Client manager claims a bucket request (accepts for their team)
// @route   POST /api/bucket/requests/:id/claim
const claimBucketRequest = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const managerId = req.user._id;
    const { id } = req.params;
    const { team_id, dealClosedAmount, advanceAmountPaid } = req.body;

    const bucketReq = await BucketRequest.findOne({ _id: id, company_id, status: 'open' })
      .populate('client_id', 'owner_name _id company_id assigned_to');
    if (!bucketReq || !bucketReq.client_id) {
      return res.status(404).json({ success: false, message: 'Bucket request not found, already claimed, or client was deleted.' });
    }

    // Build checklist items from template or defaults
    let finalItems = [];
    try {
      const template = await ChecklistTemplate.findOne({
        company_id,
        service_name: bucketReq.service_name
      });
      if (template && template.items && template.items.length > 0) {
        finalItems = template.items.map(item => ({
          title: item.title,
          description: item.description,
          label: item.title,
          isChecked: false
        }));
      }
    } catch (e) { /* no template */ }

    // Ensure client form filling step
    if (finalItems.length === 0 || finalItems[0].title !== 'Client Form Filling') {
      finalItems.unshift({
        title: 'Client Form Filling',
        description: 'Ensure the client has submitted all necessary initial forms and details.',
        label: 'Client Form Filling',
        isChecked: false
      });
    }

    // Create checklist assigned to the claiming client_manager
    const checklist = await Checklist.create({
      company_id,
      client_id: bucketReq.client_id._id,
      service_name: bucketReq.service_name,
      assigned_to: managerId,
      created_by: managerId,
      items: finalItems,
      status: 'pending',
      stage: 'quotePending',
      notes: '',
      dealClosedAmount: Number(dealClosedAmount) || 0,
      advanceAmountPaid: Number(advanceAmountPaid) || 0
    });

    // Update bucket request
    bucketReq.status = 'claimed_by_manager';
    bucketReq.claimed_by = managerId;
    bucketReq.team_id = team_id || null;
    bucketReq.claimed_at = new Date();
    bucketReq.checklist_id = checklist._id;
    await bucketReq.save();

    // If the client does not have a personal manager assigned yet, assign them to this manager
    if (!bucketReq.client_id.assigned_to) {
      await User.findByIdAndUpdate(bucketReq.client_id._id, { assigned_to: managerId });
      console.log(`Assigned client ${bucketReq.client_id._id} to manager ${managerId}`);
    }

    // Also update any matching ServiceOrder to remove it from the "New Requests" view
    const ServiceOrder = require('../models/ServiceOrder');
    await ServiceOrder.updateMany({
      clientUid: bucketReq.client_id._id.toString(),
      serviceType: bucketReq.service_name,
      status: 'active',
      stage: { $in: ['reqReceived', 'bucketPending'] }
    }, {
      stage: 'workAssigned',
      assignedExpert: req.user.owner_name
    });

    await logActivity(
      managerId,
      'bucket_claim',
      `Client manager claimed bucket request for service "${bucketReq.service_name}" (client: ${bucketReq.client_name || bucketReq.client_id})`,
      company_id
    );

    res.json({ success: true, bucketRequest: bucketReq, checklist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get available jobs for filling_staff (claimed by their team's manager)
// @route   GET /api/bucket/available
const getAvailableJobs = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const staffId = req.user._id;

    // Find teams where this staff is a member
    const teams = await Team.find({ company_id, members: staffId }).lean();

    if (teams.length === 0) {
      return res.json({ success: true, jobs: [], message: 'You are not assigned to any team.' });
    }

    const teamIds = teams.map(t => t._id);

    // Find claimed_by_manager bucket requests where the request is assigned to staff's team
    const jobs = await BucketRequest.find({
      company_id,
      status: 'claimed_by_manager',
      $or: [
        { team_id: { $in: teamIds } },
        // Fallback for older requests that don't have team_id set yet
        { claimed_by: { $in: teams.map(t => t.manager_id).filter(Boolean) }, team_id: null }
      ]
    })
      .populate('client_id', 'owner_name email phone company_name')
      .populate('claimed_by', 'owner_name email _id')
      .sort({ claimed_at: -1 })
      .lean();

    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Filling staff self-assigns a job from their team's bucket
// @route   POST /api/bucket/requests/:id/self-assign
const selfAssignJob = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const staffId = req.user._id;
    const { id } = req.params;

    const bucketReq = await BucketRequest.findOne({
      _id: id,
      company_id,
      status: 'claimed_by_manager'
    });
    if (!bucketReq) {
      return res.status(404).json({ success: false, message: 'Job not found or already taken.' });
    }

    // Verify staff is in a team managed by the claimer
    const team = await Team.findOne({
      company_id,
      manager_id: bucketReq.claimed_by,
      members: staffId
    });
    if (!team) {
      return res.status(403).json({ success: false, message: 'This job is not available to your team.' });
    }

    // Update checklist to re-assign to this staff
    if (bucketReq.checklist_id) {
      await Checklist.findByIdAndUpdate(bucketReq.checklist_id, {
        assigned_to: staffId,
        status: 'in_progress',
        stage: 'workAssigned'
      });
    }

    // Update bucket request
    bucketReq.status = 'assigned';
    bucketReq.assigned_to = staffId;
    bucketReq.assigned_at = new Date();
    await bucketReq.save();

    await logActivity(
      staffId,
      'bucket_self_assign',
      `Filling staff self-assigned job for service "${bucketReq.service_name}" (client: ${bucketReq.client_name})`,
      company_id
    );

    res.json({ success: true, bucketRequest: bucketReq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Decline a bucket request (manager declines)
// @route   POST /api/bucket/requests/:id/decline
const declineBucketRequest = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { id } = req.params;

    const bucketReq = await BucketRequest.findOne({ _id: id, company_id, status: 'open' });
    if (!bucketReq) {
      return res.status(404).json({ success: false, message: 'Bucket request not found or already processed.' });
    }

    bucketReq.status = 'declined';
    await bucketReq.save();

    res.json({ success: true, message: 'Request declined.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get bucket request count for badge display
// @route   GET /api/bucket/count
const getBucketCount = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const role = req.user.role;

    let count = 0;
    if (role === 'admin' || role === 'client_manager') {
      count = await BucketRequest.countDocuments({ company_id, status: 'open' });
    } else if (role === 'filling_staff') {
      const staffId = req.user._id;
      const teams = await Team.find({ company_id, members: staffId }).lean();
      const managerIds = teams.map(t => t.manager_id).filter(Boolean);
      count = await BucketRequest.countDocuments({
        company_id,
        status: 'claimed_by_manager',
        claimed_by: { $in: managerIds }
      });
    }

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getBucketRequests,
  claimBucketRequest,
  getAvailableJobs,
  selfAssignJob,
  declineBucketRequest,
  getBucketCount
};
