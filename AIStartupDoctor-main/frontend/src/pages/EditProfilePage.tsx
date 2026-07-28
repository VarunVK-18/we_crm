import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Building,
  MapPin,
  Globe,
  Phone,
  Mail,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { API_ENDPOINTS } from '../config/api';
import Navigation from '../components/Navigation';

interface ProfileFormData {
  startupName: string;
  founderName: string;
  city: string;
  state: string;
  country: string;
  website: string;
  contactNumber: string;
}

const EditProfilePage: React.FC = () => {
  const { currentUser, getIdToken } = useAuth();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    startupName: '',
    founderName: '',
    city: '',
    state: '',
    country: '',
    website: '',
    contactNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Populate form with existing profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        startupName: profile.startupName || '',
        founderName: profile.founderName || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        website: profile.website?.replace(/^https?:\/\//, '') || '',
        contactNumber: profile.contactNumber || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startupName.trim()) {
      newErrors.startupName = 'Startup name is required';
    }
    if (!formData.founderName.trim()) {
      newErrors.founderName = 'Founder name is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid contact number';
    }
    if (formData.website && formData.website.trim() && !/^[\w.-]+\.[a-z]{2,}$/i.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (e.g., example.com)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await getIdToken();
      
      // Prepare data with proper website URL
      const updateData = {
        ...formData,
        website: formData.website ? `https://${formData.website}` : ''
      };

      const response = await fetch(API_ENDPOINTS.ONBOARDING_UPDATE, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Profile updated successfully!');
        // Refresh profile data
        await refetch();
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setErrors({ submit: result.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Network error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center mt-20 justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Edit Profile
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
              Update your company and personal information
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Company Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Building className="w-6 h-6 text-gray-700" />
                    Company Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Startup Name *
                  </label>
                  <input
                    type="text"
                    value={formData.startupName}
                    onChange={(e) => handleInputChange('startupName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                      errors.startupName ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your startup name"
                  />
                  {errors.startupName && (
                    <p className="mt-2 text-sm text-red-600">{errors.startupName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500">https://</span>
                    </div>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={`w-full pl-20 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                        errors.website ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="yourwebsite.com"
                    />
                  </div>
                  {errors.website && (
                    <p className="mt-2 text-sm text-red-600">{errors.website}</p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <User className="w-6 h-6 text-gray-700" />
                    Personal Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Founder Name *
                  </label>
                  <input
                    type="text"
                    value={formData.founderName}
                    onChange={(e) => handleInputChange('founderName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                      errors.founderName ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter founder's name"
                  />
                  {errors.founderName && (
                    <p className="mt-2 text-sm text-red-600">{errors.founderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                      errors.contactNumber ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your contact number"
                  />
                  {errors.contactNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.contactNumber}</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Email Address</div>
                      <div className="text-gray-600">{currentUser?.email}</div>
                      <div className="text-xs text-gray-500 mt-1">Email cannot be changed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                Location Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                      errors.city ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your city"
                  />
                  {errors.city && (
                    <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                      errors.state ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your state"
                  />
                  {errors.state && (
                    <p className="mt-2 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 ${
                      errors.country ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your country"
                  />
                  {errors.country && (
                    <p className="mt-2 text-sm text-red-600">{errors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">{errors.submit}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-end">
              <Link
                to="/dashboard"
                className="flex items-center justify-center px-8 py-4 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center px-8 py-4 text-white bg-gray-900 rounded-2xl hover:bg-gray-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default EditProfilePage;