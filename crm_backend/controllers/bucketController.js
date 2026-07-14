const BucketRequest = require('../models/BucketRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const Checklist = require('../models/Checklist');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const Document = require('../models/Document');
const complianceService = require('../services/complianceService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logActivity } = require('../middleware/rbac');
const { getNextServiceId } = require('../utils/counterHelper');

// @desc    Get all OPEN bucket requests (for client_managers)
// @route   GET /api/bucket/requests
const getBucketRequests = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { 
      status = 'open',
      searchClientId,
      searchCompany,
      searchService,
      searchClientName,
      searchEmail,
      searchPhone
    } = req.query;

    const filter = { company_id };
    if (status === 'all') {
      filter.$or = [
        { status: { $ne: 'open' } },
        { status: 'open', source: { $in: ['dealvoice', 'we-crm-old', 'manual', 'we-crm', 'we-crm-new'] } }
      ];
    } else if (status === 'open') {
      filter.status = 'open';
      filter.source = { $in: ['dealvoice', 'we-crm-old', 'manual', 'we-crm', 'we-crm-new'] };
    } else {
      filter.status = status;
    }

    if (searchClientId || searchCompany || searchService || searchClientName || searchEmail || searchPhone) {
      const userFilter = {};
      let userQueryActive = false;

      if (searchClientId) { userFilter.custom_client_id = { $regex: searchClientId, $options: 'i' }; userQueryActive = true; }
      if (searchCompany) { userFilter.company_name = { $regex: searchCompany, $options: 'i' }; userQueryActive = true; }
      if (searchClientName) { userFilter.owner_name = { $regex: searchClientName, $options: 'i' }; userQueryActive = true; }
      if (searchEmail) { userFilter.email = { $regex: searchEmail, $options: 'i' }; userQueryActive = true; }
      if (searchPhone) { userFilter.phone = { $regex: searchPhone, $options: 'i' }; userQueryActive = true; }

      let matchingUserIds = [];
      if (userQueryActive) {
        const users = await User.find(userFilter).select('_id').lean();
        matchingUserIds = users.map(u => u._id);
      }

      const andConditions = [];
      if (searchClientId) andConditions.push({ $or: [{ dealvoice_client_id: { $regex: searchClientId, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });
      if (searchCompany) andConditions.push({ $or: [{ client_company_name: { $regex: searchCompany, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });
      if (searchService) andConditions.push({ service_name: { $regex: searchService, $options: 'i' } });
      if (searchClientName) andConditions.push({ $or: [{ client_name: { $regex: searchClientName, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });
      if (searchEmail) andConditions.push({ $or: [{ client_email: { $regex: searchEmail, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });
      if (searchPhone) andConditions.push({ $or: [{ client_phone: { $regex: searchPhone, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });

      if (andConditions.length > 0) {
        if (!filter.$and) filter.$and = [];
        filter.$and.push(...andConditions);
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const total = await BucketRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const requests = await BucketRequest.find(filter)
      .populate('client_id', 'custom_client_id owner_name email phone company_name')
      .populate('claimed_by', 'owner_name email _id')
      .populate('assigned_to', 'owner_name email _id')
      .populate('checklist_id', 'custom_service_id dueDate priority')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, requests, total, page, totalPages });
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
    const { team_id, dealClosedAmount, advanceAmountPaid, directorCount, dueDate, priority } = req.body;

    const bucketReq = await BucketRequest.findOne({ _id: id, company_id, status: 'open' })
      .populate('client_id', 'custom_client_id owner_name _id company_id assigned_to');
    if (!bucketReq || !bucketReq.client_id) {
      return res.status(404).json({ success: false, message: 'Bucket request not found, already claimed, or client was deleted.' });
    }

    // ─── External Compliance Service: upload COI, extract via OCR, generate compliance tasks ───
    if (bucketReq.is_external_compliance) {
      const dealAmount = Number(dealClosedAmount);
      if (isNaN(dealAmount) || dealAmount < 15000) {
        return res.status(400).json({ success: false, message: 'Minimum deal amount of ₹15,000 is required for compliance services.' });
      }

      // 1. Handle COI file upload (optional)
      let documentId = null;
      let fileUrl = null;
      if (req.file) {
        const doc = await Document.create({
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          data: req.file.buffer,
          uploadedBy: managerId
        });
        documentId = doc._id;
        fileUrl = `api/documents/${doc._id}`;
      }

      // 2. OCR / Manual Override: use provided details or extract from COI
      let extractedDetails = { companyName: null, entityType: 'Private Limited Company', incorporationDate: null, cinNumber: null, pan: null, tan: null };
      
      const hasFrontendDetails = req.body.coi_companyName || req.body.coi_incorporationDate;
      if (hasFrontendDetails) {
        extractedDetails.companyName = req.body.coi_companyName || null;
        extractedDetails.entityType = req.body.coi_entityType || 'Private Limited Company';
        extractedDetails.incorporationDate = req.body.coi_incorporationDate || null;
      } else if (req.file) {
        // Run OCR if no details were provided from the frontend
        try {
          const keys = [process.env.GEMINI_API_KEY1, process.env.GEMINI_API_KEY2, process.env.GEMINI_API_KEY3].filter(Boolean);
          const base64Data = req.file.buffer.toString('base64');
          const imagePart = { inlineData: { data: base64Data, mimeType: req.file.mimetype } };
          const prompt = `You are an expert OCR AI. Analyze this Certificate of Incorporation (COI) or similar corporate document.
Extract the following information and return ONLY a valid JSON object with no markdown formatting or extra text:
{
  "companyName": "<string or null>",
  "entityType": "<must be exactly one of: Private Limited Company, LLP, OPC, Proprietorship, Other>",
  "incorporationDate": "<YYYY-MM-DD or null>",
  "cinNumber": "<string or null>",
  "pan": "<string or null>",
  "tan": "<string or null>"
}
If a field is not found, set it to null.`;
          for (const key of keys) {
            try {
              const genAI = new GoogleGenerativeAI(key);
              const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
              const result = await model.generateContent([prompt, imagePart]);
              const text = (await result.response).text().replace(/```json/g, '').replace(/```/g, '').trim();
              extractedDetails = { ...extractedDetails, ...JSON.parse(text) };
              break;
            } catch (e) { /* try next key */ }
          }
        } catch (e) {
          console.error('[BucketClaim] COI OCR failed:', e.message);
        }
      }

      // 3. Update client record with OCR data + enable compliance radar
      const clientUpdateFields = { in_compliance_radar: true };
      if (extractedDetails.companyName) clientUpdateFields.company_name = extractedDetails.companyName;
      if (extractedDetails.pan)  clientUpdateFields.pan = extractedDetails.pan;
      if (!bucketReq.client_id.assigned_to) clientUpdateFields.assigned_to = managerId;
      await User.findByIdAndUpdate(bucketReq.client_id._id, clientUpdateFields);

      // 4. Create a dummy completed Checklist to anchor to Compliance Radar (mirrors externalOnboard)
      let custom_service_id = null;
      try { custom_service_id = await getNextServiceId(company_id); } catch (e) { console.error(e); }
      
      const incDate = extractedDetails.incorporationDate ? new Date(extractedDetails.incorporationDate) : null;
      let expiryDate = new Date(new Date().getFullYear() + 1, 8, 30);
      if (incDate) {
        expiryDate = new Date(incDate.getFullYear() + 1, 8, 30);
        if (expiryDate < new Date()) expiryDate = new Date(new Date().getFullYear() + 1, 8, 30);
      }
      const clientName = bucketReq.client_id?.company_name || bucketReq.client_company_name || bucketReq.client_name || 'Client';
      const complianceChecklist = await Checklist.create({
        company_id,
        client_id: bucketReq.client_id._id,
        custom_service_id: custom_service_id,
        service_name: 'Incorporation (External)',
        assigned_to: managerId,
        created_by: managerId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        priority: req.body.priority || 'Medium',
        status: 'completed',
        completion_percentage: 100,
        startedAt: new Date(),
        completedAt: new Date(),
        items: [],
        final_documents: fileUrl ? [{
          document_id: documentId,
          name: 'Certificate of Incorporation (External)',
          fileUrl,
          uploadedAt: new Date(),
          expiry_date: expiryDate
        }] : []
      });

      // 5. Generate compliance tasks from incorporation date
      if (incDate) {
        const entityType = extractedDetails.entityType || 'Private Limited Company';
        try {
          if (entityType === 'LLP') {
            await complianceService.generateCompliancesForLLP(bucketReq.client_id._id, company_id, complianceChecklist._id, incDate, clientName);
          } else if (entityType === 'OPC') {
            await complianceService.generateCompliancesForOPC(bucketReq.client_id._id, company_id, complianceChecklist._id, incDate, clientName);
          } else if (entityType === 'Private Limited Company' || entityType === 'Public Limited Company' || entityType.includes('Limited')) {
            await complianceService.generateCompliancesForPrivateLimited(bucketReq.client_id._id, company_id, complianceChecklist._id, incDate, clientName);
          }
        } catch (e) {
          console.error('[BucketClaim] Compliance task generation failed:', e.message);
        }
      }

      // 6. Mark bucket request as claimed (no regular checklist, but we attach the anchor)
      bucketReq.status = 'claimed_by_manager';
      bucketReq.claimed_by = managerId;
      bucketReq.team_id = team_id || null;
      bucketReq.checklist_id = complianceChecklist._id;
      bucketReq.claimed_at = new Date();
      await bucketReq.save();

      await logActivity(
        managerId,
        'bucket_claim',
        `Manager accepted compliance service "${bucketReq.service_name}" for "${clientName}" — Compliance Radar activated with ${extractedDetails.incorporationDate ? 'auto-generated tasks from incorporation date ' + extractedDetails.incorporationDate : 'no incorporation date (tasks skipped)'}`,
        company_id
      );

      return res.json({ success: true, bucketRequest: bucketReq, checklist: null, complianceChecklistId: complianceChecklist._id, extractedDetails });
    }
    // ─────────────────────────────────────────────────────────────────────────

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
          isChecked: false,
          isActionStep: item.isActionStep || false,
          need_temporary: item.need_temporary || false,
          has_custom_input: item.has_custom_input || false,
          custom_input_label: item.custom_input_label || '',
          linked_document_templates: item.linked_document_templates || []
        }));
      }
    } catch (e) { /* no template */ }

    // Ensure client form filling step
    if (finalItems.length === 0 || finalItems[0].title !== 'Client Form Filling') {
      finalItems.unshift({
        title: 'Client Form Filling',
        description: 'Ensure the client has submitted all necessary initial forms and details.',
        label: 'Client Form Filling',
        isChecked: false,
        isActionStep: true
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

    let custom_service_id = null;
    try {
      custom_service_id = await getNextServiceId(company_id);
    } catch (e) { console.error('Failed to generate custom_service_id', e); }

    // Derive the entity name from the bucket request (prefer company name)
    const entityName = bucketReq.client_company_name || bucketReq.client_name || bucketReq.client_id?.company_name || bucketReq.client_id?.owner_name || 'Client';

    const checklistPayload = {
      company_id,
      client_id: bucketReq.client_id._id,
      service_name: bucketReq.service_name,
      assigned_to: null, // Keep null so filing staff can claim it ("Yet to Assign")
      assigned_team: team_id || null,
      created_by: managerId,
      items: finalItems,
      status: 'pending',
      stage: 'quotePending',
      notes: '',
      dealClosedAmount: Number(dealClosedAmount) || 0,
      advanceAmountPaid: Number(advanceAmountPaid) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'Medium',
      details: {
        entityName,
        'Applicant Name': bucketReq.client_id?.owner_name || '',
        'Applicant Email': bucketReq.client_email || '',
        'Applicant Phone': bucketReq.client_phone || '',
        Status: 'Pending Client Form Submission',
        'Next Step': 'Assign expert to unlock form for client',
        ...(directorCount ? { numberOfDirectors: Number(directorCount) } : {})
      }
    };
    if (custom_service_id) {
      checklistPayload.custom_service_id = custom_service_id;
    }
    const checklist = await Checklist.create(checklistPayload);

    // Update bucket request
    bucketReq.status = 'claimed_by_manager';
    bucketReq.claimed_by = managerId;
    bucketReq.team_id = team_id || null;
    bucketReq.claimed_at = new Date();
    bucketReq.checklist_id = checklist._id;
    await bucketReq.save();

    // If the client does not have a personal manager assigned yet, assign them to this manager
    let userUpdateFields = {};
    if (!bucketReq.client_id.assigned_to) {
      userUpdateFields.assigned_to = managerId;
      console.log(`Assigned client ${bucketReq.client_id._id} to manager ${managerId}`);
    }
    if (directorCount !== undefined && directorCount !== null && directorCount !== '') {
      userUpdateFields.director_count = Number(directorCount) || 0;
    }
    
    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(bucketReq.client_id._id, userUpdateFields);
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

    const {
      searchServiceId,
      searchClientId,
      searchService,
      searchCompany
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const filter = {
      company_id,
      status: 'claimed_by_manager',
      $or: [
        { team_id: { $in: teamIds } },
        { claimed_by: { $in: teams.map(t => t.manager_id).filter(Boolean) }, team_id: null }
      ]
    };

    if (searchServiceId || searchClientId || searchService || searchCompany) {
      const userFilter = {};
      let userQueryActive = false;

      if (searchClientId) { userFilter.custom_client_id = { $regex: searchClientId, $options: 'i' }; userQueryActive = true; }
      if (searchCompany) { userFilter.company_name = { $regex: searchCompany, $options: 'i' }; userQueryActive = true; }

      let matchingUserIds = [];
      if (userQueryActive) {
        const users = await User.find(userFilter).select('_id').lean();
        matchingUserIds = users.map(u => u._id);
      }
      
      let matchingChecklistIds = [];
      if (searchServiceId) {
        const checklists = await Checklist.find({ custom_service_id: { $regex: searchServiceId, $options: 'i' } }).select('_id').lean();
        matchingChecklistIds = checklists.map(c => c._id);
      }

      const andConditions = [];
      if (searchServiceId) andConditions.push({ checklist_id: { $in: matchingChecklistIds } });
      if (searchClientId) andConditions.push({ $or: [{ dealvoice_client_id: { $regex: searchClientId, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });
      if (searchService) andConditions.push({ service_name: { $regex: searchService, $options: 'i' } });
      if (searchCompany) andConditions.push({ $or: [{ client_company_name: { $regex: searchCompany, $options: 'i' } }, { client_id: { $in: matchingUserIds } }] });

      if (andConditions.length > 0) {
        if (!filter.$and) filter.$and = [];
        filter.$and.push(...andConditions);
      }
    }

    const total = await BucketRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    // Find claimed_by_manager bucket requests where the request is assigned to staff's team
    const jobs = await BucketRequest.find(filter)
      .populate('client_id', 'custom_client_id owner_name email phone company_name')
      .populate('claimed_by', 'owner_name email _id')
      .populate('checklist_id', 'custom_service_id dueDate priority')
      .sort({ claimed_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ success: true, jobs, total, page, totalPages });
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

    // Verify staff is in a team managed by the claimer (or is the claimer themselves, or is admin/manager)
    const isClaimer = bucketReq.claimed_by && bucketReq.claimed_by.toString() === staffId.toString();
    const isAdminOrManager = req.user.role === 'admin' || req.user.role === 'client_manager';
    let team = null;
    if (!isClaimer && !isAdminOrManager) {
      team = await Team.findOne({
        company_id,
        manager_id: bucketReq.claimed_by,
        members: staffId
      });
    }

    if (!isClaimer && !isAdminOrManager && !team) {
      return res.status(403).json({ 
        success: false, 
        message: 'This job is not available to your team.',
        debug: {
          role: req.user.role,
          staffId,
          claimed_by: bucketReq.claimed_by,
          isClaimer,
          isAdminOrManager
        }
      });
    }

    // Update checklist to re-assign to this staff
    if (bucketReq.checklist_id) {
      const updateData = { assigned_to: staffId };
      // Only change status/stage for standard workflows; external compliance anchors stay completed
      if (!bucketReq.is_external_compliance) {
        updateData.status = 'in_progress';
        updateData.stage = 'workAssigned';
      }
      await Checklist.findByIdAndUpdate(bucketReq.checklist_id, updateData);
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
