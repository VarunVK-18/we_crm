const mongoose = require('mongoose');
const Message = require('./models/Message');

mongoose.connect('mongodb://localhost:27017/we_crm')
  .then(async () => {
    const unread = await Message.find({ seen: false });
    console.log('Total unread in DB:', unread.length);
    console.log('Unread details:', unread.map(u => u.senderRole));
    mongoose.disconnect();
  });
