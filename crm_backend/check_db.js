const mongoose = require('mongoose');
const Company = require('./models/Company');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const companies = await Company.find({});
  companies.forEach(c => {
    console.log(c.settings.bank_details);
  });
  process.exit();
});
