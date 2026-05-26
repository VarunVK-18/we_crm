const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const clients = await User.find({ role: 'customer' }).limit(1).lean();
    console.log(clients[0].email, clients[0].phone);
    process.exit(0);
  });
