const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/we_crm';

mongoose.connect(mongoURI).then(async () => {
  const Counter = require('./models/Counter');
  await Counter.findOneAndUpdate({ entity: 'service' }, { seq: 0 });
  console.log('Counter reset to 0');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
