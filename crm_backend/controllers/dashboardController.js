const Checklist = require('../models/Checklist');
const ServiceOrder = require('../models/ServiceOrder');
const User = require('../models/User');
const Team = require('../models/Team');

// List of services that require client form filling
const SERVICES_WITH_FORMS = [
  'dpiit', 'duns', 'private limited', 'trade mark', 'trademark', 'copyright',
  'llp', 'msme', 'gst', 'iso', 'fssai', 'one person company', 'opc', 'lei',
  'lie', 'bis', 'mca', 'dsc', 'iec', 'proprietorship', 'tds', 'pan, tan',
  'itr', 'pf', 'patent'
];

const SYSTEM_FIELDS = new Set([
  'entityname', 'status', 'next step', 'applicant name', 'applicant email',
  'applicant phone', 'badge', 'requesttype', 'recommended_plan', 'service_fee'
]);

// @desc    Get all dashboard stats in a single optimized call
// @route   GET /api/dashboard/stats?month=YYYY-MM
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    const companyId = user.company_id;
    const role = user.role;
    const userId = user._id;

    // ─── Build scoped filter for checklists ───────────────────────────────────
    const checklistFilter = { company_id: companyId, service_name: { $ne: 'Live Chat Support' } };

    if (role === 'filling_staff' || role === 'account_manager') {
      const myTeams = await Team.find({ members: userId }).select('_id').lean();
      const myTeamIds = myTeams.map(t => t._id);
      checklistFilter.$or = [
        { assigned_to: userId },
        { assigned_team: { $in: myTeamIds } }
      ];
    } else if (role === 'client_manager') {
      const [myClients, myTeams] = await Promise.all([
        User.find({
          role: 'customer',
          $or: [
            { assigned_to: userId },
            { created_by: userId, assigned_to: null }
          ]
        }).select('_id').lean(),
        Team.find({ members: userId }).select('_id').lean()
      ]);
      const myClientIds = myClients.map(c => c._id);
      const myTeamIds = myTeams.map(t => t._id);
      checklistFilter.$or = [
        { assigned_to: userId },
        { assigned_team: { $in: myTeamIds } },
        { client_id: { $in: myClientIds } }
      ];
    }

    // ─── Fetch checklists with only fields needed for stat computation ────────
    // We avoid sending items HTML content, notes, documents, financialLogs etc.
    const checklists = await Checklist.find(checklistFilter)
      .select('status service_name assigned_to details items.isActionStep items.isChecked requested_documents')
      .lean();

    // ─── Compute counts in JS (same logic as frontend updateStats) ────────────
    const allTasksCount = checklists.length;

    let formsPendingCount = 0;
    let docsPendingCount = 0;
    let inProgressCount = 0;
    let forReviewCount = 0;

    for (const c of checklists) {
      const status = c.status;
      const isNotDone = status !== 'completed' && status !== 'under_review';

      if (status === 'under_review') {
        forReviewCount++;
        continue;
      }

      if (isNotDone) {
        // Forms pending check
        const serviceNameLower = (c.service_name || '').toLowerCase();
        const requiresForm = SERVICES_WITH_FORMS.some(s => serviceNameLower.includes(s));
        if (requiresForm) {
          const alreadySubmitted = c.details?.clientFormSubmitted;
          const formStep = c.items?.find(item => item.isActionStep);
          const formStepChecked = formStep?.isChecked;

          if (!alreadySubmitted && !formStepChecked) {
            // Check if there are actual client-submitted keys
            const hasClientKeys = c.details && typeof c.details === 'object'
              ? Object.keys(c.details).filter(k => !SYSTEM_FIELDS.has(k.toLowerCase())).length > 0
              : false;
            if (!hasClientKeys) {
              formsPendingCount++;
            }
          }
        }

        // Docs pending check
        if (c.requested_documents?.some(d => !d.isUploaded)) {
          docsPendingCount++;
        }

        // In progress: has an assignee and not forms-pending
        const isAssigned = c.assigned_to != null;
        if (isAssigned) {
          inProgressCount++;
        }
      }
    }

    // ─── Financial totals: aggregate from ServiceOrder ────────────────────────
    // Parse requested month (YYYY-MM), default to current month
    const monthStr = req.query.month || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    const [year, month] = monthStr.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1); // exclusive

    // Role-based order filter
    const orderFilter = { companyId };

    if (role === 'client_manager') {
      // Reuse myClients computed above (already in scope for client_manager branch)
      // Need to re-derive since it may have been in a different branch
    }

    const financialAgg = await ServiceOrder.aggregate([
      {
        $match: {
          companyId,
          createdAt: { $gte: monthStart, $lt: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$dealClosedAmount' },
          amountReceived: { $sum: '$advanceAmountPaid' }
        }
      }
    ]);

    const financial = financialAgg[0] || { totalRevenue: 0, amountReceived: 0 };
    financial.pendingAmount = financial.totalRevenue - financial.amountReceived;

    res.json({
      success: true,
      stats: {
        allTasks: allTasksCount,
        formsPending: formsPendingCount,
        docsPending: docsPendingCount,
        inProgress: inProgressCount,
        forReview: forReviewCount
      },
      financial: {
        totalRevenue: financial.totalRevenue,
        amountReceived: financial.amountReceived,
        pendingAmount: financial.pendingAmount,
        month: monthStr
      }
    });
  } catch (error) {
    console.error('[getDashboardStats] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
