const mongoose = require('mongoose');
require('dotenv').config();

const { getCompanyOrders } = require('./controllers/orderController');

mongoose.connect(process.env.MONGO_URI, { dbName: 'test' }).then(async () => {
  const dummyId = '6a30f297d7c1c1cd9c70fe83';
  const dummyUser = await mongoose.model('User').findById(dummyId);
  
  const req = {
    user: dummyUser,
    params: { companyId: dummyUser.company_id.toString() }
  };
  
  const res = {
    status: (code) => ({
      json: (data) => console.log('Dummy orders API returned:', data.orders.length, 'orders')
    })
  };
  
  await getCompanyOrders(req, res);
  process.exit();
});
