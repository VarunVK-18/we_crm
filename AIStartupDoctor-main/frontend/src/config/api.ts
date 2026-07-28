// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

export const API_ENDPOINTS = {
  // Authentication
  FIREBASE_AUTH: `${API_BASE_URL}/api/auth/firebase-auth`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,

  // Onboarding
  ONBOARDING_COMPLETE: `${API_BASE_URL}/api/onboarding/complete`,
  ONBOARDING_STATUS: `${API_BASE_URL}/api/onboarding/status`,
  ONBOARDING_UPDATE: `${API_BASE_URL}/api/onboarding/update`,

  // Health Check
  HEALTH_CHECK_SAVE: `${API_BASE_URL}/api/health-check/save-results`,
  HEALTH_CHECK_HISTORY: `${API_BASE_URL}/api/health-check/history`,
  HEALTH_CHECK_LATEST: `${API_BASE_URL}/api/health-check/latest`,
  HEALTH_CHECK_STATS: `${API_BASE_URL}/api/health-check/stats`,

  // Users
  USER_DASHBOARD: `${API_BASE_URL}/api/users/dashboard`,
  USER_SUBSCRIPTION: `${API_BASE_URL}/api/users/subscription`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,

  // Shareable Reports
  SHAREABLE_REPORTS_CREATE: `${API_BASE_URL}/api/shareable-reports/create`,
  SHAREABLE_REPORTS_GET: (companySlug: string, hash: string) => `${API_BASE_URL}/api/shareable-reports/${companySlug}/${hash}`,
  SHAREABLE_REPORTS_LIST: `${API_BASE_URL}/api/shareable-reports/user/list`,
  SHAREABLE_REPORTS_DELETE: (hash: string) => `${API_BASE_URL}/api/shareable-reports/${hash}`,

  // External APIs
  COMPANY_DATA: (cin: string) => `${API_BASE_URL}/api/company/${cin}`,

  // PDF Generation
  GENERATE_PDF: `${API_BASE_URL}/api/generate-pdf`,

  // Health Check
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;