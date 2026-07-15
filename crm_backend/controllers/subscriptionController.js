const Subscription = require('../models/Subscription');
const Checklist = require('../models/Checklist');
const ComplianceTask = require('../models/ComplianceTask');
const RenewalHistory = require('../models/RenewalHistory');

exports.renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const oldSubscription = await Subscription.findById(subscriptionId);

    if (!oldSubscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const now = new Date();
    
    // Set old subscription status
    oldSubscription.status = 'Renewed';
    oldSubscription.renewal_status = 'Renewed';
    await oldSubscription.save();

    const newActivationDate = now;
    const newExpiryDate = new Date();
    newExpiryDate.setFullYear(newActivationDate.getFullYear() + 1);

    const newSubscription = await Subscription.create({
      client_id: oldSubscription.client_id,
      company_id: oldSubscription.company_id,
      checklist_id: oldSubscription.checklist_id,
      plan_name: oldSubscription.plan_name,
      plan_tier: oldSubscription.plan_tier,
      service_type: oldSubscription.service_type,
      service_fee: oldSubscription.service_fee,
      activation_date: newActivationDate,
      expiry_date: newExpiryDate,
      status: 'Active',
      renewal_status: 'Not Renewed'
    });

    await RenewalHistory.create({
      subscription_id: oldSubscription._id,
      client_id: oldSubscription.client_id,
      old_expiry_date: oldSubscription.expiry_date,
      new_expiry_date: newExpiryDate,
      renewed_by: req.user?._id || oldSubscription.client_id
    });

    res.status(200).json({ success: true, message: 'Subscription renewed successfully', subscription: newSubscription });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateSubscription = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const checklist = await Checklist.findById(checklistId);

    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    if (!checklist.recommended_plan) {
      return res.status(400).json({ success: false, message: 'No recommended plan found for this checklist. Ensure turnover is set.' });
    }

    // Determine tier from recommended_plan
    let planTier = 'Startup';
    if (checklist.recommended_plan === 'Corporate Plan') planTier = 'Corporate';
    if (checklist.recommended_plan === 'Enterprise Plan') planTier = 'Enterprise';

    // Set expiry 1 year from now
    const activationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(activationDate.getFullYear() + 1);

    const subscription = await Subscription.create({
      client_id: checklist.client_id,
      company_id: checklist.company_id,
      checklist_id: checklist._id,
      plan_name: checklist.details?.recommended_plan || checklist.recommended_plan,
      plan_tier: planTier,
      service_type: checklist.service_name,
      service_fee: checklist.details?.service_fee || checklist.recommended_fee,
      activation_date: activationDate,
      expiry_date: expiryDate,
      status: 'Active'
    });

    const sName = (checklist.service_name || '').toLowerCase();
    const eName = (checklist.details?.entityName || '').toLowerCase();
    
    // Generate Compliance Tasks
    const tasksToCreate = [];
    const currentYear = new Date().getFullYear().toString();
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1); // Default due in 1 month for setup

    if (sName.includes('mca')) {
      if (eName.includes('private limited') || eName.includes('pvt') || eName.includes('opc') || eName.includes('public limited') || eName.includes('section 8')) {
        tasksToCreate.push({ title: 'AOC-4 Filing' }, { title: 'MGT-7 Filing' }, { title: 'DIR-3 KYC' });
      } else if (eName.includes('llp')) {
        tasksToCreate.push({ title: 'Form 8 Filing' }, { title: 'Form 11 Filing' });
      }
    }
    
    if (sName.includes('gst')) {
      tasksToCreate.push({ title: 'GSTR-1 Filing' }, { title: 'GSTR-3B Filing' }, { title: 'GSTR-9 Annual Return' });
    }

    if (tasksToCreate.length > 0) {
      const taskDocs = tasksToCreate.map(t => ({
        clientUid: checklist.client_id,
        checklistId: checklist._id,
        companyId: checklist.company_id,
        entityName: checklist.details?.entityName || '',
        title: t.title,
        description: `Automatically generated compliance task for ${checklist.service_name}`,
        dueDate: dueDate,
        filing_year: currentYear,
        status: 'Upcoming'
      }));
      await ComplianceTask.insertMany(taskDocs);
    }

    res.status(201).json({ success: true, message: 'Subscription activated successfully', subscription });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMySubscriptions = async (req, res) => {
  try {
    const clientId = req.user._id;
    const subscriptions = await Subscription.find({ client_id: clientId })
      .populate('checklist_id', 'details entityName companyName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
