const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

// Import Models
const AuditLog = require('./models/AuditLog');
const Banner = require('./models/Banner');
const BucketRequest = require('./models/BucketRequest');
const Certificate = require('./models/Certificate');
const Checklist = require('./models/Checklist');
const ChecklistTemplate = require('./models/ChecklistTemplate');
const Company = require('./models/Company');
const ComplianceCalendar = require('./models/ComplianceCalendar');
const ComplianceReminder = require('./models/ComplianceReminder');
const ComplianceTask = require('./models/ComplianceTask');
const Counter = require('./models/Counter');
const Document = require('./models/Document');
const DocumentTemplate = require('./models/DocumentTemplate');
const DscOrder = require('./models/DscOrder');
const DscToken = require('./models/DscToken');
const DscTokenLog = require('./models/DscTokenLog');
const FilingTask = require('./models/FilingTask');
const GlobalCounter = require('./models/GlobalCounter');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const RenewalHistory = require('./models/RenewalHistory');
const ServiceDetails = require('./models/ServiceDetails');
const ServiceOrder = require('./models/ServiceOrder');
const Subscription = require('./models/Subscription');
const Team = require('./models/Team');
const Ticket = require('./models/Ticket');
const User = require('./models/User');

const { createDemoPdfBuffer, createDemoImageBuffer, ensureDemoFilesExist } = require('./utils/demoDocumentGenerator');

// Check for clear flag
const shouldClear = process.argv.includes('--clear') || process.argv.includes('--reset');

// Core Statutory Categories (used for models with restrictive schema enums like ServiceDetails)
const CORE_SERVICE_CATEGORIES = [
  'MCA', 'DPIIT', 'GST', 'Trademark', 'BIS', 'Copyright', 'Patent',
  'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS', 'PF', 'LEI', 'IEC', 'MSME'
];

// All Service Types in WE-CRM (29 Services covering Incorporation, Compliance, IP, Tax, and Licensing)
const SERVICE_TYPES = [
  'MCA', 'DPIIT', 'GST', 'Trademark', 'BIS', 'Copyright', 'Patent',
  'ITR', 'DSC', 'FSSAI', 'DUNS', 'TDS', 'PF', 'LEI', 'IEC', 'MSME',
  'Private Limited Incorporation', 'LLP Incorporation', 'OPC', 'Proprietorship',
  'MCA Compliance', 'Trade Mark', 'GST filing', 'GST Cancelation',
  'GST Registration', 'ISO', 'IE code', 'RoHS', 'CE'
];

// Short, Medium, and Long Human Names for Clients
const CLIENT_NAMES = [
  // Short names
  { first: 'Ana', last: 'Li', email: 'ana@we.in' },
  { first: 'Raj', last: 'Rao', email: 'raj@co.in' },
  { first: 'Dev', last: 'Om', email: 'dev@x.in' },
  { first: 'Samy', last: 'Wu', email: 'samy@wu.in' },
  { first: 'Leo', last: 'Ma', email: 'leo@ma.in' },
  { first: 'Eva', last: 'Go', email: 'eva@go.in' },
  { first: 'Joy', last: 'Sen', email: 'joy@sen.in' },
  { first: 'Max', last: 'Ray', email: 'max@ray.in' },
  { first: 'Pia', last: 'Das', email: 'pia@das.in' },
  { first: 'Yash', last: 'Pal', email: 'yash@pal.in' },
  // Medium names
  { first: 'Ananya', last: 'Sharma', email: 'ananya.sharma@techventures.co.in' },
  { first: 'Vikramaditya', last: 'Varma', email: 'vikramaditya.varma@varmacapital.in' },
  { first: 'Aarav', last: 'Nambiar', email: 'aarav.nambiar@nambiargroup.com' },
  { first: 'Sneha', last: 'Mukherjee', email: 'sneha.mukherjee@bengalcatalysts.in' },
  { first: 'Karthik', last: 'Subramanian', email: 'karthik.s@southindiaexports.co.in' },
  { first: 'Rishabh', last: 'Singhania', email: 'rishabh.singhania@singhaniafoods.com' },
  { first: 'Deepika', last: 'Deshmukh', email: 'deepika.d@deshmukhlogistics.in' },
  { first: 'Siddharth', last: 'Chatterjee', email: 'siddharth@chatterjeelabs.co.in' },
  // Very long / extended names
  { first: 'Venkatasubramanian', last: 'Ramachandran-Nair', email: 'venkatasubramanian.ramachandran.nair@enterprisesolutions.co.in' },
  { first: 'Thiruvananthapuram', last: 'Krishnamurthy', email: 'thiruvananthapuram.krishnamurthy@globalbiotechindia.com' },
  { first: 'Chandrasekhara', last: 'Ramanathan-Iyer', email: 'chandrasekhara.venkata.ramanathan.iyer@southernpower.co.in' },
  { first: 'Lakshminarayanan', last: 'Ananthakrishnan-Pillai', email: 'lakshminarayanan.ananthakrishnan.pillai@pillaiholdings.in' },
  { first: 'Srinivasa', last: 'Raghavan-Tiruchirappalli', email: 'srinivasa.raghavan.tiruchirappalli@tanjavurengineering.co.in' },
  { first: 'Balasubramaniam', last: 'Sankaranarayanan', email: 'balasubramaniam.sankaranarayanan@maduraifabrics.in' },
  { first: 'Parthasarathy', last: 'Venkataramanujam', email: 'parthasarathy.venkataramanujam@kanchipuramsilks.com' }
];

const COMPANY_NAMES = [
  'WE-CRM Global Enterprises Private Limited',
  'Softrate Technologies & Solutions LLP',
  'Nexus Venture Capital India Private Limited',
  'Vanguard Healthcare Solutions Private Limited',
  'Suryoday Renewable Energy Systems LLP',
  'Southern Power Distribution Holdings Limited',
  'Madurai Textiles & Handloom Exports Pvt Ltd',
  'Tanjavur Precision Engineering Works LLP',
  'Kanchipuram Silks & Textiles Private Limited',
  'Singhania Organic Foods & Spices Private Limited',
  'Bengal Catalyst & Chemical Works Private Limited',
  'Deshmukh Logistics & Supply Chain Systems LLP',
  'Chatterjee Diagnostic Laboratories Private Limited',
  'South India Marine Exports & Cold Storage Pvt Ltd',
  'Nambiar Real Estate & Infra Development Private Limited'
];

async function seedDatabase() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm';
  console.log('=== STARTING 150-RECORD SEEDING ACROSS ALL CRM CATEGORIES ===');
  console.log('Target MongoDB URI:', mongoURI);

  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB successfully.');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Ensure demo files exist in uploads/
  const uploadsDir = path.join(__dirname, 'uploads');
  ensureDemoFilesExist(uploadsDir);
  console.log('Verified demo documents in /uploads/ directory.');

  if (shouldClear) {
    console.log('Clearing existing seeded collections (--clear flag provided)...');
    await Promise.all([
      AuditLog.deleteMany({}),
      Banner.deleteMany({}),
      BucketRequest.deleteMany({}),
      Certificate.deleteMany({}),
      Checklist.deleteMany({}),
      ChecklistTemplate.deleteMany({}),
      ComplianceCalendar.deleteMany({}),
      ComplianceReminder.deleteMany({}),
      ComplianceTask.deleteMany({}),
      Counter.deleteMany({}),
      Document.deleteMany({}),
      DocumentTemplate.deleteMany({}),
      DscOrder.deleteMany({}),
      DscToken.deleteMany({}),
      DscTokenLog.deleteMany({}),
      FilingTask.deleteMany({}),
      GlobalCounter.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      RenewalHistory.deleteMany({}),
      ServiceDetails.deleteMany({}),
      ServiceOrder.deleteMany({}),
      Subscription.deleteMany({}),
      Team.deleteMany({}),
      Ticket.deleteMany({}),
      User.deleteMany({}),
      Company.deleteMany({})
    ]);
    console.log('All 27 collections cleared.');
  }

  const defaultPasswordHash = await bcrypt.hash('Password@123', 12);
  const targetCompanyId = process.env.WE_CRM_COMPANYID || '6a41f4249a6e3704d7ca9fb4';

  // ─────────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SEED SINGLE PRIMARY COMPANY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding Single Primary Company (WE-CRM Global Enterprises)...');
  const suffix = shouldClear ? '' : '_' + Math.floor(Math.random() * 1000000);
  const companyObj = {
    company_code: 'WE',
    company_name: COMPANY_NAMES[0],
    gstin: '33AAACW9990K1Z0',
    phone: '+919840010000',
    address: '10, Anna Salai, Guindy, Chennai, Tamil Nadu 600032',
    status: 'active',
    settings: {
      incorporation_fee: 5000,
      default_filing_tax: 18,
      gst_percentage: 18,
      cgst_percentage: 9,
      allow_agent_registration: true,
      require_document_verification: true,
      enable_document_extraction: true,
      require_payment_verification: true,
      bank_details: {
        bank_name: 'HDFC Bank',
        account_number: '501000200100',
        ifsc: 'HDFC0000001',
        branch_name: 'Anna Salai Branch',
        savings_account_last_four: '1234',
        current_account_last_four: '5678',
        savings_upi_id: 'wecrm.we@hdfcbank',
        current_upi_id: 'wecrm.current.we@hdfcbank',
        add_gst_savings: false,
        add_gst_current: true,
        add_gst_savings_upi: false,
        add_gst_current_upi: true
      }
    }
  };

  const primaryCompany = await Company.findOneAndUpdate(
    { _id: targetCompanyId },
    { $set: companyObj },
    { upsert: true, returnDocument: 'after' }
  );
  const seededCompanies = [primaryCompany];
  console.log('Seeded 1 Single Primary Company.');

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SEED USERS (150 Users: 1 Single Admin, Account Managers, Staff & Customers)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Users (1 Single Admin, Managers, Staff, and Customers with short & long names)...');
  const usersData = [];

  // Staff Roles: 1 Single Admin, 10 Filling Staff, 5 Client Managers
  const staffRoles = [
    { role: 'admin', count: 1, prefix: 'admin' },
    { role: 'filling_staff', count: 10, prefix: 'staff' },
    { role: 'client_manager', count: 5, prefix: 'clientmgr' }
  ];

  let userCounter = 1;
  for (const roleGroup of staffRoles) {
    for (let j = 1; j <= roleGroup.count; j++) {
      const email = roleGroup.role === 'admin'
        ? (shouldClear ? 'admin@we-crm.co.in' : `admin${suffix}@we-crm.co.in`)
        : `${roleGroup.prefix}${j}${suffix}@we-crm.co.in`;
      const ownerName = roleGroup.role === 'admin'
        ? 'WE-CRM Single Admin'
        : `${roleGroup.role.replace('_', ' ').toUpperCase()} Staff ${j}`;

      usersData.push({
        company_id: primaryCompany._id,
        owner_name: ownerName,
        email: email,
        credentialHash: defaultPasswordHash,
        phone: `+91980000${userCounter.toString().padStart(4, '0')}`,
        role: roleGroup.role,
        company_code: 'WE',
        company_name: primaryCompany.company_name,
        status: 'active',
        onboard: true,
        permissions: ['all']
      });
      userCounter++;
    }
  }

  // Remaining Customers / Clients (~124 to make 150 total users)
  const numCustomers = 150 - usersData.length;
  for (let c = 0; c < numCustomers; c++) {
    const profile = CLIENT_NAMES[c % CLIENT_NAMES.length];
    const clientCompany = primaryCompany;
    const isLong = profile.first.length > 8 || profile.email.length > 25;

    // Distinguish short vs long email if multiple
    const uniqueEmail = (c < CLIENT_NAMES.length
      ? profile.email
      : (isLong
          ? `${profile.first.toLowerCase()}.${profile.last.toLowerCase()}.${c}@enterprisesolutions.co.in`
          : `${profile.first.toLowerCase()}${c}@we.in`)).replace('@', `${suffix}@`);

    const clientName = `${profile.first} ${profile.last}`;

    usersData.push({
      company_id: clientCompany._id,
      custom_client_id: `CL${1001 + c}`,
      owner_name: clientName,
      email: uniqueEmail,
      credentialHash: defaultPasswordHash,
      phone: `+91994000${c.toString().padStart(4, '0')}`,
      role: 'customer',
      compliance_case: ['case1', 'case2', 'case3'][c % 3],
      compliance_year_count: c % 5,
      company_code: clientCompany.company_code,
      company_name: clientCompany.company_name,
      business_type: ['Private Limited', 'Proprietorship', 'LLP', 'Public Limited'][c % 4],
      pan: `AAACW${1000 + c}K`,
      pan_name: clientName,
      tan: `CHET0${1000 + c}B`,
      cin: `U72900TN2023PTC1${5000 + c}`,
      incorporation_date: new Date(Date.now() - (c + 1) * 30 * 24 * 3600 * 1000),
      gstin: `33AAACW${1000 + c}K1Z${c % 9}`,
      address: `${10 + c}, Industrial Estate, Guindy, Chennai 600032`,
      city: 'Chennai',
      state: 'Tamil Nadu',
      postal_code: '600032',
      status: 'active',
      onboard: true,
      director_count: 2,
      revenue: (c + 1) * 2500000,
      annual_turnover: `${(c + 1) * 25} Lakhs`,
      mca_profile_completed: true,
      coi_file: '/uploads/demo_coi.pdf',
      moa_file: '/uploads/demo_moa.pdf',
      aoa_file: '/uploads/demo_aoa.pdf',
      bank_statement_file: '/uploads/demo_receipt.pdf',
      sales_invoice_file: '/uploads/demo_invoice.pdf',
      onboarding_documents: [
        { name: 'Incorporation Certificate', fileUrl: '/uploads/demo_coi.pdf', uploadedAt: new Date() },
        { name: 'GST Certificate', fileUrl: '/uploads/demo_gstin.pdf', uploadedAt: new Date() },
        { name: 'PAN Card', fileUrl: '/uploads/demo_pan.pdf', uploadedAt: new Date() }
      ],
      client_entities: [
        {
          entityName: clientCompany.company_name,
          entityType: 'Private Limited',
          cin: `U72900TN2023PTC1${5000 + c}`,
          pan: `AAACW${1000 + c}K`,
          gstin: `33AAACW${1000 + c}K1Z${c % 9}`,
          coi: '/uploads/demo_coi.pdf',
          dsc: '/uploads/demo_dsc_token.pdf'
        }
      ],
      directors: [
        {
          firstName: profile.first,
          lastName: profile.last,
          role: 'Managing Director',
          email: uniqueEmail,
          phone: `+91994000${c.toString().padStart(4, '0')}`,
          pan: `AAACW${1000 + c}K`,
          din: `0800${1000 + c}`
        }
      ],
      bank_details: {
        bankName: 'ICICI Bank',
        accountNumber: `00010500${1000 + c}`,
        ifscCode: 'ICIC0000001',
        accountType: 'Current',
        branchName: 'Guindy Branch'
      }
    });
  }

  const seededUsers = await User.insertMany(usersData);
  console.log(`Seeded ${seededUsers.length} Users.`);

  // Separate staff and client users for reference
  const adminUsers = seededUsers.filter(u => u.role === 'admin');
  const managerUsers = seededUsers.filter(u => u.role === 'client_manager');
  const staffUsers = seededUsers.filter(u => u.role === 'filling_staff');
  const clientUsers = seededUsers.filter(u => u.role === 'customer');

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SEED TEAMS (15 Teams)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 15 Teams...');
  const teamsData = Array.from({ length: 15 }).map((_, i) => ({
    company_id: primaryCompany._id,
    name: `WE Statutory Pod ${i + 1} (${SERVICE_TYPES[i % SERVICE_TYPES.length]})${suffix}`,
    manager_id: managerUsers[i % managerUsers.length]?._id || adminUsers[0]._id,
    members: [
      staffUsers[(i * 2) % staffUsers.length]?._id,
      staffUsers[(i * 2 + 1) % staffUsers.length]?._id
    ].filter(Boolean)
  }));
  const seededTeams = await Team.insertMany(teamsData);
  console.log(`Seeded ${seededTeams.length} Teams.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SEED DOCUMENTS IN MONGODB (150 Documents with real valid PDF/PNG Buffers)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Documents in MongoDB...');
  const demoPdfBuffer = createDemoPdfBuffer('WE CRM Seeded Document', 'Verified Statutory Attachment', 'Stored as MongoDB Buffer');
  const documentsData = Array.from({ length: 150 }).map((_, i) => ({
    filename: `statutory_record_${i + 1}.pdf`,
    contentType: 'application/pdf',
    data: demoPdfBuffer,
    uploadedBy: clientUsers[i % clientUsers.length]?._id || adminUsers[0]._id,
    approval_status: ['Uploaded', 'Under Review', 'Approved', 'Approved', 'Approved'][i % 5],
    approved_by: adminUsers[0]._id,
    review_comments: `Document verified by compliance team during annual audit #${i + 1}`
  }));
  const seededDocuments = await Document.insertMany(documentsData);
  console.log(`Seeded ${seededDocuments.length} MongoDB Documents.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SEED SERVICE ORDERS (150 Service Orders across all 16 service types)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Service Orders...');
  const serviceOrdersData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    const sType = SERVICE_TYPES[i % SERVICE_TYPES.length];
    const stage = ['reqReceived', 'workAssigned', 'workInProgress', 'testing', 'completed'][i % 5];
    const status = stage === 'completed' ? 'complete' : 'active';

    return {
      clientUid: String(client._id),
      companyId: client.company_id || primaryCompany._id,
      entityName: client.business_type || 'Private Limited',
      serviceType: sType,
      companyName: client.company_name || 'Client Enterprise Pvt Ltd',
      status: status,
      stage: stage,
      assignedExpert: managerUsers[i % managerUsers.length]?.owner_name || 'Account Manager 1',
      expertPhone: managerUsers[i % managerUsers.length]?.phone || '+919800000001',
      dealClosedAmount: (i + 1) * 1500 + 5000,
      advanceAmountPaid: 5000,
      dueDate: new Date(Date.now() + (i - 30) * 24 * 3600 * 1000),
      priority: ['High', 'Medium', 'Low'][i % 3],
      steps: [
        { title: 'Application Document Verification', description: 'Check COI, PAN, and KYC docs', isCompleted: true, completedAt: new Date() },
        { title: 'Government Portal Filing', description: `Filing under ${sType} statutory regulations`, isCompleted: stage === 'completed' || stage === 'testing', completedAt: new Date() },
        { title: 'Challan & Certificate Verification', description: 'Download approved certificate', isCompleted: stage === 'completed', completedAt: new Date() }
      ],
      documents: [
        { name: 'Application Document', filename: 'demo_coi.pdf', fileUrl: '/uploads/demo_coi.pdf' },
        { name: 'Statutory Challan', filename: 'demo_receipt.pdf', fileUrl: '/uploads/demo_receipt.pdf' }
      ],
      financialLogs: [
        { paymentType: 'Advance Payment', amount: 5000, transactionId: `TXN-ADV-${10000 + i}`, paymentTimestamp: new Date(), isVerified: true },
        { paymentType: 'Final Settlement', amount: (i + 1) * 1500, transactionId: `TXN-FIN-${20000 + i}`, paymentTimestamp: new Date(), isVerified: stage === 'completed' }
      ],
      turnover_category: 'Up to 50 Lakhs',
      recommended_plan: 'Annual Comprehensive Compliance Plan',
      service_fee: (i + 1) * 1500 + 5000,
      need_temporary: i % 2 === 0
    };
  });
  const seededServiceOrders = await ServiceOrder.insertMany(serviceOrdersData);
  console.log(`Seeded ${seededServiceOrders.length} Service Orders.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SEED SERVICE DETAILS (150 Encrypted Service Credential Records)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Service Details (Encrypted Client Credentials)...');
  const serviceDetailsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    const sType = CORE_SERVICE_CATEGORIES[i % CORE_SERVICE_CATEGORIES.length];
    return {
      clientId: client._id,
      serviceType: sType,
      username: `client.mca.${i + 100}@wecrm.in`,
      credentialHash: await bcrypt.hash(`SecureCred#2026_${i + 1}`, 12),
      leiNumber: sType === 'LEI' ? `335800WE${100000 + i}Z19` : '',
      iecNumber: sType === 'IEC' ? `04190${1000 + i}` : '',
      udyamNumber: sType === 'MSME' ? `UDYAM-TN-02-${10000 + i}` : '',
      issueDate: new Date(Date.now() - (i + 1) * 15 * 24 * 3600 * 1000),
      status: 'active',
      pfCode: sType === 'PF' ? `TN/MAS/000${1000 + i}/000` : '',
      tan: sType === 'TDS' ? `CHET0${1000 + i}B` : '',
      gstTrn: sType === 'GST' ? `TRN33AAACW${1000 + i}` : '',
      expiryDate: new Date(Date.now() + (365 - i) * 24 * 3600 * 1000)
    };
  });
  const seededServiceDetails = await ServiceDetails.insertMany(serviceDetailsData);
  console.log(`Seeded ${seededServiceDetails.length} Service Details.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. SEED CHECKLISTS & CHECKLIST TEMPLATES (150 Checklists + 16 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`Seeding ${SERVICE_TYPES.length} Checklist Templates & 150 Checklists...`);
  const checklistTemplatesData = SERVICE_TYPES.map((sType, i) => ({
    company_id: primaryCompany._id,
    service_name: sType + suffix,
    enable_document_extraction: true,
    need_temporary: i % 2 === 0,
    sop_document: seededDocuments[i % seededDocuments.length]?._id,
    items: [
      {
        title: 'Upload PAN & Aadhaar',
        description: `Client KYC submission for ${sType} processing.`,
        staff_description: 'Verify identity documents on statutory portal.',
        request_document: true,
        getBill: false,
        need_temporary: false
      },
      {
        title: 'Verify Challan Payment',
        description: 'Statutory fee and challan verification.',
        staff_description: 'Match challan receipt with government portal.',
        request_document: false,
        getBill: true,
        need_temporary: false
      },
      {
        title: 'Government Filing & QC',
        description: `Drafting and submitting ${sType} application.`,
        staff_description: 'Review draft with Manager before submission.',
        request_document: false,
        getBill: false,
        need_temporary: true
      },
      {
        title: 'Issue Final Certificate',
        description: 'Upload signed statutory certificate / acknowledgment.',
        staff_description: 'Attach official document and notify client.',
        request_document: false,
        getBill: false,
        need_temporary: false
      }
    ]
  }));
  const seededChecklistTemplates = await ChecklistTemplate.insertMany(checklistTemplatesData);
  console.log(`Seeded ${seededChecklistTemplates.length} Checklist Templates.`);

  const checklistsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    const sType = SERVICE_TYPES[i % SERVICE_TYPES.length];
    return {
      company_id: client.company_id || primaryCompany._id,
      custom_service_id: `SD26${String(1 + i).padStart(3, '0')}`,
      client_id: client._id,
      created_by: managerUsers[i % managerUsers.length]?._id || adminUsers[0]._id,
      service_name: sType,
      status: ['pending', 'in_progress', 'under_review', 'completed'][i % 4],
      items: [
        {
          label: 'Client Identity Verification',
          title: 'Verify PAN & Aadhar',
          description: 'Matched against database records',
          staff_description: 'Verified online on Income Tax Portal',
          resolution_note: 'Approved',
          isActionStep: true,
          request_document: true
        },
        {
          label: 'Statutory Fee Reimbursement',
          title: 'Filing Challan',
          getBill: true,
          isActionStep: false
        }
      ],
      expenses: [
        {
          amount: 2500 + i * 10,
          billUrl: '/uploads/demo_invoice.pdf',
          transactionId: `TXN-EXP-${50000 + i}`,
          paymentTimestamp: new Date(),
          uploadedAt: new Date(),
          reimbursementStatus: i % 2 === 0 ? 'paid' : 'pending',
          paidByName: adminUsers[0].owner_name
        }
      ]
    };
  });
  const seededChecklists = await Checklist.insertMany(checklistsData);
  console.log(`Seeded ${seededChecklists.length} Checklists.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. SEED COMPLIANCE TASKS (150 Tasks across statuses & warning levels)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Compliance Tasks...');
  const complianceTasksData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    const statusList = ['Upcoming', 'Due Soon', 'Critical', 'Overdue', 'Completed'];
    const warningList = ['None', 'Due Soon', 'Warning', 'Critical', 'Due Tomorrow', 'Overdue'];
    const doc = seededDocuments[i % seededDocuments.length];

    return {
      clientUid: client._id,
      companyId: client.company_id || primaryCompany._id,
      checklistId: seededChecklists[i % seededChecklists.length]?._id,
      entityName: client.company_name,
      title: `${SERVICE_TYPES[i % SERVICE_TYPES.length]} Statutory Return Filing - FY 2025-26 (${i + 1})`,
      description: `Annual statutory filing requirement for ${client.company_name}`,
      dueDate: new Date(Date.now() + (i - 40) * 24 * 3600 * 1000),
      status: statusList[i % statusList.length],
      proofDocument: doc._id,
      certificateDocument: doc._id,
      acknowledgementDocument: doc._id,
      filing_year: '2025-26',
      assigned_staff_id: staffUsers[i % staffUsers.length]?._id || adminUsers[0]._id,
      warning_status: warningList[i % warningList.length]
    };
  });
  const seededComplianceTasks = await ComplianceTask.insertMany(complianceTasksData);
  console.log(`Seeded ${seededComplianceTasks.length} Compliance Tasks.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. SEED FILING TASKS (150 Filing Tasks)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Filing Tasks...');
  const filingTasksData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      company_id: client.company_id || primaryCompany._id,
      client_id: client._id,
      assigned_to: staffUsers[i % staffUsers.length]?._id || null,
      created_by: managerUsers[i % managerUsers.length]?._id || adminUsers[0]._id,
      title: `${SERVICE_TYPES[i % SERVICE_TYPES.length]} Filing Assignment #${i + 1}`,
      description: `Complete regulatory submission and upload acknowledgment for ${client.owner_name}`,
      status: ['Not Started', 'In Progress', 'Pending Documents', 'Under Review', 'Approved', 'Completed'][i % 6],
      documents: [
        { name: 'Application Document', fileUrl: '/uploads/demo_coi.pdf', uploadedAt: new Date() }
      ],
      comments: [
        { author: 'Account Manager', text: 'Please complete the filing before the due date.', createdAt: new Date() }
      ]
    };
  });
  const seededFilingTasks = await FilingTask.insertMany(filingTasksData);
  console.log(`Seeded ${seededFilingTasks.length} Filing Tasks.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. SEED SUPPORT TICKETS (150 Tickets INC1001 to INC1150)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Support Tickets...');
  const ticketCategories = ['Technical Issue', 'Compliance Enquiry', 'Payment & Billing', 'DSC Token Issue', 'GST Filing Query', 'MCA Portal Login'];
  const ticketsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      ticketId: `INC${1001 + i}${suffix}`,
      userId: String(client._id),
      userName: client.owner_name,
      userEmail: client.email,
      subject: `[${ticketCategories[i % ticketCategories.length]}] Assistance required for ${client.company_name}`,
      description: `Client ${client.owner_name} requested guidance regarding statutory filing return and document verification #${i + 1}.`,
      category: ticketCategories[i % ticketCategories.length],
      priority: ['Low', 'Medium', 'High'][i % 3],
      status: ['Pending', 'In Progress', 'Resolved'][i % 3],
      expert: managerUsers[i % managerUsers.length]?.owner_name || 'Assigned Support Specialist'
    };
  });
  const seededTickets = await Ticket.insertMany(ticketsData);
  console.log(`Seeded ${seededTickets.length} Support Tickets.`);

  // Update GlobalCounter for ticket sequence
  await GlobalCounter.findOneAndUpdate(
    { entity: 'ticket' },
    { $set: { seq: 150 } },
    { upsert: true }
  );

  // Update company Counter sequences for clients (CL1000 + seq) and services (SR1000 + seq)
  await Counter.findOneAndUpdate(
    { company_id: primaryCompany._id, entity: 'client' },
    { $set: { seq: numCustomers } },
    { upsert: true }
  );
  await Counter.findOneAndUpdate(
    { company_id: primaryCompany._id, entity: 'service' },
    { $set: { seq: 150 } },
    { upsert: true }
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. SEED CERTIFICATES (150 Certificates)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Certificates...');
  const certificatesData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      client_id: client._id,
      entityName: client.company_name,
      serviceName: SERVICE_TYPES[i % SERVICE_TYPES.length],
      certificateNumber: `CERT-WE-2026-${1000 + i}${suffix}`,
      issueDate: new Date(Date.now() - (i + 1) * 20 * 24 * 3600 * 1000),
      expiryDate: new Date(Date.now() + (365 - i) * 24 * 3600 * 1000),
      renewalRequired: true,
      renewalStatus: ['Active', 'Active', 'Expiring Soon', 'Renewed'][i % 4],
      latestRenewalChecklistId: seededChecklists[i % seededChecklists.length]?._id || null
    };
  });
  const seededCertificates = await Certificate.insertMany(certificatesData);
  console.log(`Seeded ${seededCertificates.length} Certificates.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. SEED SUBSCRIPTIONS & RENEWAL HISTORY (150 Subscriptions + 150 Renewals)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Subscriptions & Renewal History entries...');
  const planNames = ['Annual Comprehensive Plan', 'GST Monthly Compliance Plan', 'Trademark Protection Tier', 'MCA Annual Return Pack', 'DSC Renewal Care'];
  const subscriptionsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      client_id: client._id,
      company_id: client.company_id || primaryCompany._id,
      checklist_id: seededChecklists[i % seededChecklists.length]?._id || null,
      plan_name: planNames[i % planNames.length],
      plan_tier: ['Basic', 'Professional', 'Enterprise'][i % 3],
      service_type: SERVICE_TYPES[i % SERVICE_TYPES.length],
      service_fee: 15000 + (i * 500),
      activation_date: new Date(Date.now() - 180 * 24 * 3600 * 1000),
      expiry_date: new Date(Date.now() + (185 - i) * 24 * 3600 * 1000),
      status: ['Active', 'Active', 'Expiring Soon', 'Expired', 'Renewed'][i % 5],
      renewal_status: ['None', 'Requested', 'Completed'][i % 3]
    };
  });
  const seededSubscriptions = await Subscription.insertMany(subscriptionsData);
  console.log(`Seeded ${seededSubscriptions.length} Subscriptions.`);

  const renewalHistoryData = Array.from({ length: 150 }).map((_, i) => {
    const sub = seededSubscriptions[i % seededSubscriptions.length];
    return {
      subscription_id: sub._id,
      client_id: sub.client_id,
      old_expiry_date: new Date(Date.now() - 365 * 24 * 3600 * 1000),
      new_expiry_date: sub.expiry_date,
      renewed_by: adminUsers[0]._id,
      notes: `Annual statutory renewal processed for ${sub.plan_name}`
    };
  });
  const seededRenewals = await RenewalHistory.insertMany(renewalHistoryData);
  console.log(`Seeded ${seededRenewals.length} Renewal History records.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. SEED BUCKET REQUESTS (150 Lead Bucket Requests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Lead Bucket Requests...');
  const sourcesList = ['dealvoice', 'manual', 'we-crm', 'we-crm-new', 'opportunity'];
  const bucketRequestsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      company_id: primaryCompany._id,
      client_id: client._id,
      service_name: SERVICE_TYPES[i % SERVICE_TYPES.length],
      status: ['open', 'claimed_by_manager', 'assigned', 'declined'][i % 4],
      claimed_by: managerUsers[i % managerUsers.length]?._id || null,
      team_id: seededTeams[i % seededTeams.length]?._id || null,
      claimed_at: new Date(),
      assigned_to: staffUsers[i % staffUsers.length]?._id || null,
      assigned_at: new Date(),
      checklist_id: seededChecklists[i % seededChecklists.length]?._id || null,
      source: sourcesList[i % sourcesList.length],
      client_name: client.owner_name,
      client_phone: client.phone,
      client_email: client.email,
      client_company_name: client.company_name,
      dealvoice_client_id: `DV-LEAD-${8000 + i}`,
      is_external_compliance: i % 10 === 0
    };
  });
  const seededBuckets = await BucketRequest.insertMany(bucketRequestsData);
  console.log(`Seeded ${seededBuckets.length} Bucket Requests.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. SEED DSC ORDERS, TOKENS & LOGS (150 Orders + 150 Tokens + 150 Logs)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 DSC Orders, Tokens, and Token Logs...');
  const dscOrdersData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      clientUid: String(client._id),
      name: client.owner_name,
      type: 'Class 3 (Signature + Encryption)',
      stage: ['Pending Verification', 'In Process', 'Token Issued', 'Completed'][i % 4],
      progress: (i % 4) * 0.33,
      isCompleted: i % 4 === 3
    };
  });
  const seededDscOrders = await DscOrder.insertMany(dscOrdersData);
  console.log(`Seeded ${seededDscOrders.length} DSC Orders.`);

  const dscTokensData = Array.from({ length: 150 }).map((_, i) => ({
    availableTokens: 150 - i,
    totalPurchased: 500,
    totalConsumed: 350 + i,
    individualCount: 250,
    organizationalCount: 100,
    warningLimit: 10
  }));
  const seededDscTokens = await DscToken.insertMany(dscTokensData);
  console.log(`Seeded ${seededDscTokens.length} DSC Tokens.`);

  const dscTokenLogsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      serviceType: ['Individual DSC', 'Organizational DSC', 'Purchase'][i % 3],
      applicantName: client.owner_name,
      companyName: client.company_name,
      tokensConsumed: 1,
      tokensAdded: 0,
      remainingBalance: 150 - i,
      processedBy: staffUsers[i % staffUsers.length]?._id || adminUsers[0]._id,
      checklistId: seededChecklists[i % seededChecklists.length]?._id || null
    };
  });
  const seededDscLogs = await DscTokenLog.insertMany(dscTokenLogsData);
  console.log(`Seeded ${seededDscLogs.length} DSC Token Logs.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. SEED COMPLIANCE CALENDAR & REMINDERS (150 Events + 150 Reminders)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Compliance Calendar Events & Reminders...');
  const calendarData = Array.from({ length: 150 }).map((_, i) => ({
    year: '2026-2027',
    documentId: seededDocuments[i % seededDocuments.length]._id,
    uploadedBy: adminUsers[0]._id,
    events: [
      {
        dueDate: `2026-0${(i % 9) + 1}-15`,
        title: `${SERVICE_TYPES[i % SERVICE_TYPES.length]} Statutory Deadline #${i + 1}`,
        description: `Regulatory due date for ${SERVICE_TYPES[i % SERVICE_TYPES.length]} returns.`,
        category: SERVICE_TYPES[i % SERVICE_TYPES.length],
        formsOrSections: 'Form GSTR-3B / MCA AOC-4',
        applicableTo: 'All Private Limited Companies'
      }
    ]
  }));
  const seededCalendar = await ComplianceCalendar.insertMany(calendarData);
  console.log(`Seeded ${seededCalendar.length} Compliance Calendar Events.`);

  const remindersData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      clientUid: String(client._id),
      serviceName: SERVICE_TYPES[i % SERVICE_TYPES.length],
      entityName: client.company_name,
      daysLeft: 30 - (i % 30),
      status: ['expiringSoon', 'urgent', 'expired'][i % 3]
    };
  });
  const seededReminders = await ComplianceReminder.insertMany(remindersData);
  console.log(`Seeded ${seededReminders.length} Compliance Reminders.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. SEED DOCUMENT TEMPLATES (16 Templates)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(`Seeding ${SERVICE_TYPES.length} Document Templates...`);
  const documentTemplatesData = SERVICE_TYPES.map((sType, i) => ({
    company_id: primaryCompany._id,
    name: `${sType} Engagement Letter Template`,
    description: `Standard form agreement and KYC template for ${sType} clients`,
    html_content: `<h1>${sType} Engagement Letter</h1><p>Welcome to WE-CRM statutory services.</p>`,
    created_by: adminUsers[0]._id,
    requires_customer_verification: true
  }));
  const seededDocTemplates = await DocumentTemplate.insertMany(documentTemplatesData);
  console.log(`Seeded ${seededDocTemplates.length} Document Templates.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. SEED BANNERS (15 Banners)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 15 Banners...');
  const bannersData = Array.from({ length: 15 }).map((_, i) => ({
    title: `Statutory Filing Advisory #${i + 1}: Stay Compliant with WE-CRM`,
    subtitle: `Explore our new automated ${SERVICE_TYPES[i % SERVICE_TYPES.length]} compliance radar and filing service.`,
    imageUrl: '/uploads/demo_logo.png',
    targetUrl: '/dashboard/compliance',
    theme: ['light', 'dark', 'purple', 'emerald', 'amber', 'rose'][i % 6],
    buttonText: 'Check Due Dates',
    isActive: true,
    createdBy: adminUsers[0]._id,
    priority: i + 1,
    clickCount: (i + 1) * 45
  }));
  const seededBanners = await Banner.insertMany(bannersData);
  console.log(`Seeded ${seededBanners.length} Banners.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. SEED CHAT MESSAGES, NOTIFICATIONS & AUDIT LOGS (150 of each)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding 150 Chat Messages, 150 Notifications, and 150 Audit Logs...');
  const messagesData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    const isClientSender = i % 2 === 0;
    return {
      orderId: String(seededServiceOrders[i % seededServiceOrders.length]._id),
      senderId: isClientSender ? client._id : adminUsers[0]._id,
      senderRole: isClientSender ? 'client' : 'admin',
      content: isClientSender
        ? `Hello, I have uploaded the requested documents for ${SERVICE_TYPES[i % SERVICE_TYPES.length]}. Please check.`
        : `Thank you ${client.owner_name}. Our statutory filing team has verified your documents.`,
      seen: i % 3 !== 0
    };
  });
  const seededMessages = await Message.insertMany(messagesData);
  console.log(`Seeded ${seededMessages.length} Messages.`);

  const notificationsData = Array.from({ length: 150 }).map((_, i) => {
    const client = clientUsers[i % clientUsers.length];
    return {
      client_id: client._id,
      title: `${SERVICE_TYPES[i % SERVICE_TYPES.length]} Status Update`,
      message: `Your service order #${i + 1} has moved to step: Government Portal Filing.`,
      type: ['chat', 'document_request', 'status_update'][i % 3],
      isRead: i % 2 === 0
    };
  });
  const seededNotifications = await Notification.insertMany(notificationsData);
  console.log(`Seeded ${seededNotifications.length} Notifications.`);

  const auditLogsData = Array.from({ length: 150 }).map((_, i) => {
    const staff = staffUsers[i % staffUsers.length] || adminUsers[0];
    return {
      performed_by: staff._id,
      action: ['USER_ONBOARDED', 'DOCUMENT_APPROVED', 'SERVICE_ORDER_UPDATED', 'TICKET_RESOLVED', 'FILING_COMPLETED'][i % 5],
      details: `Staff member ${staff.owner_name} performed statutory operation #${i + 1} on ${SERVICE_TYPES[i % SERVICE_TYPES.length]} record.`,
      company_id: primaryCompany._id
    };
  });
  const seededAuditLogs = await AuditLog.insertMany(auditLogsData);
  console.log(`Seeded ${seededAuditLogs.length} Audit Logs.`);

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY TABLE REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('             WE-CRM BACKEND SEEDING COMPLETED SUCCESSFULLY      ');
  console.log('================================================================');
  console.table([
    { Collection: 'Company', SeededCount: seededCompanies.length },
    { Collection: 'User (Clients & Staff)', SeededCount: seededUsers.length },
    { Collection: 'Team', SeededCount: seededTeams.length },
    { Collection: 'Document (MongoDB Buffers)', SeededCount: seededDocuments.length },
    { Collection: 'ServiceOrder', SeededCount: seededServiceOrders.length },
    { Collection: 'ServiceDetails (Encrypted)', SeededCount: seededServiceDetails.length },
    { Collection: 'ChecklistTemplate', SeededCount: seededChecklistTemplates.length },
    { Collection: 'Checklist', SeededCount: seededChecklists.length },
    { Collection: 'ComplianceTask', SeededCount: seededComplianceTasks.length },
    { Collection: 'FilingTask', SeededCount: seededFilingTasks.length },
    { Collection: 'Ticket (Incidents)', SeededCount: seededTickets.length },
    { Collection: 'Certificate', SeededCount: seededCertificates.length },
    { Collection: 'Subscription', SeededCount: seededSubscriptions.length },
    { Collection: 'RenewalHistory', SeededCount: seededRenewals.length },
    { Collection: 'BucketRequest (Leads)', SeededCount: seededBuckets.length },
    { Collection: 'DscOrder', SeededCount: seededDscOrders.length },
    { Collection: 'DscToken', SeededCount: seededDscTokens.length },
    { Collection: 'DscTokenLog', SeededCount: seededDscLogs.length },
    { Collection: 'ComplianceCalendar', SeededCount: seededCalendar.length },
    { Collection: 'ComplianceReminder', SeededCount: seededReminders.length },
    { Collection: 'DocumentTemplate', SeededCount: seededDocTemplates.length },
    { Collection: 'Banner', SeededCount: seededBanners.length },
    { Collection: 'Message', SeededCount: seededMessages.length },
    { Collection: 'Notification', SeededCount: seededNotifications.length },
    { Collection: 'AuditLog', SeededCount: seededAuditLogs.length }
  ]);

  const totalRecords =
    seededCompanies.length +
    seededUsers.length +
    seededTeams.length +
    seededDocuments.length +
    seededServiceOrders.length +
    seededServiceDetails.length +
    seededChecklistTemplates.length +
    seededChecklists.length +
    seededComplianceTasks.length +
    seededFilingTasks.length +
    seededTickets.length +
    seededCertificates.length +
    seededSubscriptions.length +
    seededRenewals.length +
    seededBuckets.length +
    seededDscOrders.length +
    seededDscTokens.length +
    seededDscLogs.length +
    seededCalendar.length +
    seededReminders.length +
    seededDocTemplates.length +
    seededBanners.length +
    seededMessages.length +
    seededNotifications.length +
    seededAuditLogs.length;

  console.log(`\nTOTAL MONGODB DOCUMENTS SEEDED: ${totalRecords}`);
  console.log('Login credentials for seeded staff/client users: Password@123');
  console.log('Primary WE-CRM Company ID preserved:', String(primaryCompany._id));
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase();
