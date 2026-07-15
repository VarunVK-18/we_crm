const Counter = require('../models/Counter');

/**
 * Gets the next auto-incremented sequence for a specific entity within a company
 * @param {ObjectId|string} companyId - The ID of the company
 * @param {string} entity - The entity name ('client', 'service', etc.)
 * @returns {Promise<number>} - The next sequence number
 */
const getNextSequence = async (companyId, entity) => { console.log("getNextSequence called with:", companyId, entity); 
  if (!companyId) {
    throw new Error('company_id is required to generate sequence');
  }

  const counter = await Counter.findOneAndUpdate(
    { company_id: companyId, entity: entity },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return counter.seq;
};

/**
 * Gets the next Client ID string (e.g. CLI-1001)
 */
const getNextClientId = async (companyId) => {
  const seq = await getNextSequence(companyId, 'client');
  return `CL${1000 + seq}`;
};

/**
 * Gets the next Service ID string (e.g. SRV-1001)
 */
const getNextServiceId = async (companyId) => {
  const seq = await getNextSequence(companyId, 'service');
  return `SR${10000 + seq}`;
};

module.exports = {
  getNextSequence,
  getNextClientId,
  getNextServiceId
};
