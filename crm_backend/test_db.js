const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/')
  .then(async () => {
    const roles = await User.distinct('role');
    console.log('Roles:', roles);
    
    const withEntities = await User.find({ 'client_entities.0': { $exists: true } }, 'role owner_name company_name');
    console.log('Users with entities:', JSON.stringify(withEntities, null, 2));

    mongoose.connection.close();
  });
