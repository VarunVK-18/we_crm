const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Counter = require('./models/Counter');
  const counters = await Counter.find({});
  console.log('Counters:', counters);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
