const mongoose = require('mongoose');
const ChecklistTemplate = require('./crm_backend/models/ChecklistTemplate');
mongoose.connect('mongodb://127.0.0.1:27017/we_crm_db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const templates = await ChecklistTemplate.find({}, 'service_name enable_document_extraction items.title');
    console.log(JSON.stringify(templates, null, 2));
    process.exit(0);
  });
