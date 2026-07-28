import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import HealthCheckPage from './pages/HealthCheckPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import EditProfilePage from './pages/EditProfilePage';
import SharedReportPage from './pages/SharedReportPage';
import ContactPage from './pages/ContactPage';
import SubscriptionPage from './pages/SubscriptionPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireOnboarding={true}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/health-check"
              element={
                <ProtectedRoute requireOnboarding={true}>
                  <HealthCheckPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requireOnboarding={true}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute requireOnboarding={true}>
                  <EditProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shared-report/:companySlug/:hash"
              element={<SharedReportPage />}
            />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
