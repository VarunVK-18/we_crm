const Subscription = require('../models/Subscription');
const Checklist = require('../models/Checklist');

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
    if (checklist.recommended_plan === 'Business Plan') planTier = 'Business';
    if (checklist.recommended_plan === 'Corporate Plan') planTier = 'Corporate';

    // Set expiry 1 year from now
    const activationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(activationDate.getFullYear() + 1);

    const subscription = await Subscription.create({
      client_id: checklist.client_id,
      company_id: checklist.company_id,
      checklist_id: checklist._id,
      plan_name: checklist.recommended_plan,
      plan_tier: planTier,
      service_type: checklist.service_name,
      service_fee: checklist.recommended_fee,
      activation_date: activationDate,
      expiry_date: expiryDate,
      status: 'Active'
    });

    res.status(201).json({ success: true, message: 'Subscription activated successfully', subscription });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMySubscriptions = async (req, res) => {
  try {
    const clientId = req.user._id;
    const subscriptions = await Subscription.find({ client_id: clientId }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
