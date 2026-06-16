const mongoose = require('mongoose');
require('dotenv').config();

const { getClients } = require('./controllers/authController');

mongoose.connect(process.env.MONGO_URI, { dbName: 'test' }).then(async () => {
  const dummyId = '6a30f297d7c1c1cd9c70fe83';
  const dummyUser = await mongoose.model('User').findById(dummyId);
  
  const req = {
    user: dummyUser,
    query: {}
  };
  
  const res = {
    status: (code) => ({
      json: (data) => console.log('Dummy clients API returned Error:', data)
    }),
    json: (data) => console.log('Dummy clients API returned:', data.user ? data.user.length : data.length, 'clients (or object)')
  };
  
  await getClients(req, res);
  process.exit();
});
