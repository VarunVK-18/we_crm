import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface OnboardingStatus {
  isOnboarded: boolean;
  loading: boolean;
  error: string | null;
}

interface OnboardingData {
  startupName: string;
  city: string;
  state: string;
  country: string;
  website: string;
  founderName: string;
  contactNumber: string;
}

export const useOnboarding = () => {
  const { currentUser, getIdToken } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>({
    isOnboarded: false,
    loading: true,
    error: null
  });

  const checkOnboardingStatus = async () => {
    if (!currentUser) {
      setStatus({ isOnboarded: false, loading: false, error: null });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const token = await getIdToken();
      
      const response = await fetch(API_ENDPOINTS.ONBOARDING_STATUS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus({
          isOnboarded: data.isOnboarded || false,
          loading: false,
          error: null
        });
      } else {
        const errorData = await response.json();
        setStatus({
          isOnboarded: false,
          loading: false,
          error: errorData.message || 'Failed to check onboarding status'
        });
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setStatus({
        isOnboarded: false,
        loading: false,
        error: 'Network error occurred'
      });
    }
  };

  const completeOnboarding = async (data: OnboardingData): Promise<boolean> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await getIdToken();
      const response = await fetch(API_ENDPOINTS.ONBOARDING_COMPLETE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          email: currentUser.email
        })
      });

      if (response.ok) {
        setStatus(prev => ({ ...prev, isOnboarded: true }));
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<OnboardingData>): Promise<boolean> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await getIdToken();
      const response = await fetch(API_ENDPOINTS.ONBOARDING_UPDATE, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, [currentUser]);

  return {
    ...status,
    checkOnboardingStatus,
    completeOnboarding,
    updateProfile,
    refetch: checkOnboardingStatus
  };
};

export default useOnboarding;