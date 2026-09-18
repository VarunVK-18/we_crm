require('dotenv').config();
const mongoose = require('mongoose');
const EntityProfile = require('./models/EntityProfile');
const Subscription = require('./models/Subscription');
const Checklist = require('./models/Checklist');

mongoose.connect(process.env.MONGO_URI, { dbName: 'test' })
  .then(async () => {
    let profile = null; // simulate no profile found
    const entityName = "TEERTH GOPICON PRIVATE LIMITED";
    profile = { entityName: entityName };
    
    const now = new Date();
    const activeSubs = await Subscription.find({
      status: 'Active',
      expiry_date: { $gte: now }
    }).populate('checklist_id', 'entityName companyName details');

    const getSubEntity = (sub) => {
      const cl = sub.checklist_id || {};
      if (cl.details) {
        if (cl.details.entityName) return cl.details.entityName.trim().toLowerCase();
        if (cl.details.companyName) return cl.details.companyName.trim().toLowerCase();
        if (cl.details.proposed_company_name) return cl.details.proposed_company_name.trim().toLowerCase();
        if (cl.details.businessName) return cl.details.businessName.trim().toLowerCase();
      }
      if (cl.entityName) return cl.entityName.trim().toLowerCase();
      if (cl.companyName) return cl.companyName.trim().toLowerCase();
      if (sub.entityName) return sub.entityName.trim().toLowerCase();
      if (sub.companyName) return sub.companyName.trim().toLowerCase();
      return '';
    };

    const profileEntity = (profile.entityName || '').trim().toLowerCase();
    const hasMatchingPlan = activeSubs.some(sub => {
      const subEntity = getSubEntity(sub);
      return subEntity === profileEntity || subEntity === '';
    });
    
    console.log('hasMatchingPlan:', hasMatchingPlan);
    process.exit(0);
  });
