const mongoose = require('mongoose');
const ServiceOrder = require('./models/ServiceOrder');
const User = require('./models/User');

mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/test?retryWrites=true&w=majority')
  .then(async () => {
    const user = await User.findOne({ role: 'customer' });
    if (!user) {
      console.log('No user found');
      process.exit(0);
    }
    const order = new ServiceOrder({
      clientUid: user._id.toString(),
      companyId: user.company_id,
      entityName: user.company_name || 'My Test Company',
      serviceType: 'GST Registration',
      status: 'active',
      stage: 'reqReceived',
      assignedExpert: 'To be assigned'
    });
    await order.save();
    console.log('Dummy order created!');
    process.exit(0);
  });
