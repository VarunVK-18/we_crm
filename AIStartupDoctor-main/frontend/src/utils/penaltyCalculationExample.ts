/**
 * Example of penalty calculation for demonstration
 * This shows how the cumulative penalty risk is calculated
 */

// Example scenario: A startup with multiple compliance issues
const exampleAnswers = {
  1: 'No',        // Company not incorporated - ₹5.5L penalty
  2: 'No',        // MCA returns not filed - ₹2.75L penalty  
  4: 'No',        // GST not registered - ₹85k penalty
  5: 'No',        // GST returns missed (3 months) - calculated penalty
  7: 'No',        // Trademark not filed - ₹3.75L penalty
  11: 'Some licenses missing', // Industry licenses - ₹7.5L penalty
  13: 'Yes'       // Outstanding liabilities - ₹1.5L penalty
};

const exampleFollowUpAnswers = {
  5: '3',  // 3 months of GST returns missed
};

// This would result in:
// Legal Structure Risk: ₹5,50,000
// MCA Non-compliance: ₹2,75,000  
// GST Non-registration: ₹85,000
// GST Late Filing: ₹600 + interest ≈ ₹1,000
// Brand Protection Risk: ₹3,75,000
// Regulatory Compliance Risk: ₹7,50,000
// Financial Distress Risk: ₹1,50,000

// Total Maximum Risk: ₹21,86,000 (≈₹21.9L)
// Average Realistic Risk: ₹15,30,000 (≈₹15.3L) (70% of max)
// Display Range: ₹15.3L - ₹21.9L

export const examplePenaltyCalculation = {
  answers: exampleAnswers,
  followUpAnswers: exampleFollowUpAnswers,
  expectedRange: '₹15.3L - ₹21.9L',
  message: 'This creates FOMO by showing the real financial impact of non-compliance'
};