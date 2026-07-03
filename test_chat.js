const mongoose = require('mongoose');
const Message = require('./crm_backend/models/Message');

mongoose.connect('mongodb://localhost:27017/we_crm', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const unread = await Message.countDocuments({ seen: false });
    console.log('Total unread in DB:', unread);
    mongoose.disconnect();
  });
