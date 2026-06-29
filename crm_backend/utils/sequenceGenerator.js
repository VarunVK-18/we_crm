const Counter = require('../models/Counter');

async function getNextSequenceValue(company_id, entity, prefix) {
  if (!company_id) throw new Error('company_id is required to generate a sequence');

  const sequenceDocument = await Counter.findOneAndUpdate(
    { company_id, entity },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // Format the sequence with leading zeros (e.g., 0001, 0002)
  const formattedSeq = String(sequenceDocument.seq).padStart(4, '0');
  
  return `${prefix}-${formattedSeq}`;
}

module.exports = {
  getNextSequenceValue
};
