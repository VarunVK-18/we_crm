const mongoose = require('mongoose');
const ChecklistTemplate = require('./models/ChecklistTemplate');
mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/')
  .then(async () => {
    const templates = await ChecklistTemplate.find({}, 'service_name enable_document_extraction items.title');
    console.log(JSON.stringify(templates, null, 2));
    process.exit(0);
  });
