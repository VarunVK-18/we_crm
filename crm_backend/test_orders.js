const mongoose = require('mongoose');
const ServiceOrder = require('./models/ServiceOrder');

mongoose.connect('mongodb+srv://kingkohli43255_db_user:UjMgPzVdBG9353yE@cluster0.bxb9nii.mongodb.net/test?retryWrites=true&w=majority')
  .then(async () => {
    const orders = await ServiceOrder.find({}).lean();
    console.log("TOTAL ORDERS:", orders.length);
    if (orders.length > 0) {
      console.log(orders[0]);
    }
    process.exit(0);
  });
