/**
 * Test data for the new PDF report structure
 * Following: Problems → Fear → Call to Action → Solution
 */

export const testPDFData = {
  companyName: "TechStart Innovations Pvt Ltd",
  reportDate: "12 November 2025",
  overallScore: 45, // Low score to trigger FOMO
  categoryScores: [
    {
      category: "Legal Structure",
      score: 30,
      insights: "Critical gaps in incorporation",
      status: "critical"
    },
    {
      category: "Taxation",
      score: 60,
      insights: "GST compliance issues",
      status: "needs-attention"
    },
    {
      category: "IP Protection",
      score: 20,
      insights: "No trademark protection",
      status: "critical"
    },
    {
      category: "Licenses",
      score: 70,
      insights: "Some permits missing",
      status: "good"
    }
  ],
  strengths: [
    "Company is legally incorporated",
    "Basic bookkeeping in place",
    "Founder KYC completed"
  ],
  redFlags: [
    "MCA annual returns not filed for 2 years",
    "GST registration pending despite ₹25L+ turnover",
    "Trademark not filed - brand vulnerable",
    "Industry licenses missing for operations",
    "Outstanding tax liabilities of ₹3.5L"
  ],
  riskForecast: {
    period: "6-Month Risk Forecast",
    risks: [
      {
        type: "MCA Non-compliance",
        penalty: "₹2.75L penalty + strike-off risk",
        probability: "high",
        estimatedAmount: 275000
      },
      {
        type: "GST Penalties",
        penalty: "₹85k + 18% tax on turnover",
        probability: "high", 
        estimatedAmount: 450000
      },
      {
        type: "Brand Protection Risk",
        penalty: "₹3.75L + legal costs",
        probability: "high",
        estimatedAmount: 375000
      },
      {
        type: "License Violations",
        penalty: "₹7.5L + operational shutdown",
        probability: "medium",
        estimatedAmount: 750000
      }
    ],
    totalPenaltyRisk: {
      minAmount: 275000,
      maxAmount: 1850000,
      averageAmount: 1295000,
      formattedRange: "₹12.9L - ₹18.5L"
    }
  }
};

// This creates maximum FOMO:
// - Low compliance score (45/100)
// - Multiple critical red flags
// - High penalty risk (₹12.9L - ₹18.5L)
// - Immediate action required messaging
// - Clear solution pathway with Startup Doctor