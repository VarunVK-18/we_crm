import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface UserProfile {
  id: string;
  email: string;
  startupName: string;
  founderName: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  contactNumber: string;
  isOnboardingComplete: boolean;
}

export const useUserProfile = () => {
  const { currentUser, getIdToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      const token = await getIdToken();

      const response = await fetch(API_ENDPOINTS.PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.user);
        setError(null);
      } else {
        setError('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [currentUser]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  };
};

export default useUserProfile;