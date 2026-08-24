const mongoose = require('mongoose');
const Checklist = require('./models/Checklist');
const Subscription = require('./models/Subscription');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/we_crm');
  const checklist = await Checklist.findOne({ _id: '6a8c1b1d27c0d6064635ec85' });
  
  if (checklist && checklist.status === 'completed' && checklist.recommended_plan) {
    const existingSub = await Subscription.findOne({ checklist_id: checklist._id });
    if (!existingSub) {
      let planTier = 'Startup';
      if (checklist.recommended_plan === 'Corporate Plan') planTier = 'Corporate';
      if (checklist.recommended_plan === 'Enterprise Plan') planTier = 'Enterprise';

      const activationDate = new Date();
      const expiryDate = new Date();
      const currentMonth = activationDate.getMonth();
      const targetYear = currentMonth > 2 ? activationDate.getFullYear() + 1 : activationDate.getFullYear();
      expiryDate.setFullYear(targetYear, 2, 31);
      expiryDate.setHours(23, 59, 59, 999);

      await Subscription.create({
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
      console.log('Created missing subscription for completed MCA order');
    } else {
      console.log('Subscription already exists');
    }
  } else {
    console.log('Not ready for subscription');
  }
  process.exit();
}
fix();
