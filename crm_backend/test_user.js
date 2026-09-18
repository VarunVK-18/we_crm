const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect('mongodb://127.0.0.1:27017/we_crm').then(async () => {
    const users = await User.find({ role: 'client' }).lean();
    console.log(JSON.stringify(users.map(u => ({ email: u.email, mcaProfile: !!u.mcaProfile, clientEntities: u.clientEntities?.length })), null, 2));
    process.exit(0);
});
