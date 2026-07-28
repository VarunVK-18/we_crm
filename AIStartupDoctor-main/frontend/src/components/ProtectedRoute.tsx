import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = false 
}) => {
  const { currentUser, loading: authLoading, getIdToken } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<{
    isOnboarded: boolean;
    loading: boolean;
  }>({ isOnboarded: false, loading: true });
  const location = useLocation();

  const registerUserInDatabase = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.FIREBASE_AUTH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          email: currentUser.email,
          founderName: currentUser.displayName || 'Unknown Founder'
        })
      });

      if (!response.ok) {
        console.error('Failed to register user in database');
      }
    } catch (error) {
      console.error('Error registering user in database:', error);
    }
  };

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!currentUser) {
        setOnboardingStatus({ isOnboarded: false, loading: false });
        return;
      }

      try {
        const token = await getIdToken();
        const response = await fetch(API_ENDPOINTS.ONBOARDING_STATUS, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOnboardingStatus({ 
            isOnboarded: data.isOnboarded || false, 
            loading: false 
          });
        } else if (response.status === 401) {
          // User not found in database, need to register
          const errorData = await response.json();
          if (errorData.code === 'USER_NOT_FOUND') {
            // Try to register the user
            await registerUserInDatabase();
            // Retry checking onboarding status
            setTimeout(() => checkOnboardingStatus(), 1000);
            return;
          }
          setOnboardingStatus({ isOnboarded: false, loading: false });
        } else {
          // If API call fails, assume not onboarded
          setOnboardingStatus({ isOnboarded: false, loading: false });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingStatus({ isOnboarded: false, loading: false });
      }
    };

    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [currentUser, authLoading, getIdToken, location.pathname]);

  // Show loading spinner while checking auth and onboarding status
  if (authLoading || onboardingStatus.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle onboarding requirements
  if (requireOnboarding) {
    if (!onboardingStatus.isOnboarded) {
      // If user is not onboarded and trying to access a protected route
      return <Navigate to="/onboarding" replace />;
    }
  } else {
    // If this is the onboarding route and user is already onboarded
    if (location.pathname === '/onboarding' && onboardingStatus.isOnboarded) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;