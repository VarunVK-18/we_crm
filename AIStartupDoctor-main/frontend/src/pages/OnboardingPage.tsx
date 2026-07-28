import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../hooks/useOnboarding';
import Navigation from '../components/Navigation';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface OnboardingData {
  startupName: string;
  city: string;
  state: string;
  country: string;
  website: string;
  founderName: string;
  contactNumber: string;
}

const OnboardingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { isOnboarded, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OnboardingData>({
    startupName: '',
    city: '',
    state: '',
    country: '',
    website: '',
    founderName: '',
    contactNumber: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Only redirect if already onboarded when component first loads
    if (isOnboarded && !onboardingLoading) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]); // Removed isOnboarded and onboardingLoading from dependencies

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.startupName.trim()) {
          newErrors.startupName = 'Startup name is required';
        }
        if (!formData.founderName.trim()) {
          newErrors.founderName = 'Founder name is required';
        }
        break;
      case 2:
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
          newErrors.state = 'State is required';
        }
        if (!formData.country.trim()) {
          newErrors.country = 'Country is required';
        }
        break;
      case 3:
        if (!formData.contactNumber.trim()) {
          newErrors.contactNumber = 'Contact number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(formData.contactNumber)) {
          newErrors.contactNumber = 'Please enter a valid contact number';
        }
        if (formData.website && formData.website !== 'https://' && !/^https:\/\/.+\..+/.test(formData.website)) {
          newErrors.website = 'Please enter a valid website URL';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      // Prepare form data with website as '-' if empty
      const submitData = {
        ...formData,
        website: formData.website.trim() === '' || formData.website === 'https://' ? '-' : formData.website
      };

      const success = await completeOnboarding(submitData);
      if (success) {
        // Add a small delay to ensure backend processing is complete
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to complete onboarding' });
      setLoading(false);
    }
    // Don't set loading to false if successful, as we're redirecting
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-gray-900 rounded-2xl p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <Building className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Tell us about your startup</h2>
        <p className="text-gray-600 text-lg">Let's start with the basics about your company</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Startup Name *
          </label>
          <input
            type="text"
            value={formData.startupName}
            onChange={(e) => handleInputChange('startupName', e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.startupName ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder="Enter your startup name"
          />
          {errors.startupName && (
            <p className="mt-2 text-sm text-red-600">{errors.startupName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Founder Name *
          </label>
          <input
            type="text"
            value={formData.founderName}
            onChange={(e) => handleInputChange('founderName', e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.founderName ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder="Enter founder's name"
          />
          {errors.founderName && (
            <p className="mt-2 text-sm text-red-600">{errors.founderName}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-gray-900" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Where are you located?</h2>
        <p className="text-gray-600 text-lg">Help us understand your market presence</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.city ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
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
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.state ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
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
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.country ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder="Enter your country"
          />
          {errors.country && (
            <p className="mt-2 text-sm text-red-600">{errors.country}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <Phone className="h-8 w-8 text-gray-900" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Contact Information</h2>
        <p className="text-gray-600 text-lg">How can we reach you?</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Contact Number *
          </label>
          <input
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => handleInputChange('contactNumber', e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.contactNumber ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            placeholder="Enter your contact number"
          />
          {errors.contactNumber && (
            <p className="mt-2 text-sm text-red-600">{errors.contactNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Website (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg">https://</span>
            </div>
            <input
              type="text"
              value={formData.website.replace(/^https?:\/\//, '')}
              onChange={(e) => {
                const value = e.target.value;
                // Always prepend https:// when saving to state
                handleInputChange('website', value ? `https://${value}` : '');
              }}
              className={`w-full pl-24 pr-6 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-300 text-lg ${errors.website ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              placeholder="yourwebsite.com"
            />
          </div>
          {errors.website && (
            <p className="mt-2 text-sm text-red-600">{errors.website}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-sm sm:text-base text-gray-700 font-medium break-all">Email:</span>
          </div>
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <span className="text-sm sm:text-base text-gray-700 font-medium break-all">{currentUser?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4 sm:mb-6">
              SETUP YOUR PROFILE
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Complete Your
              <br />
              <span className="text-gray-400">Onboarding</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10">
              Help us personalize your experience by providing some basic information about your startup.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-900">Step {currentStep} of 3</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gray-900 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-12">
            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Error Message */}
            {errors.submit && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center justify-center px-8 py-4 text-sm font-medium rounded-2xl transition-all duration-300 ${currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border-2 border-transparent hover:border-gray-300'
                  }`}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center justify-center px-8 py-4 text-sm font-medium text-white bg-gray-900 rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center justify-center px-8 py-4 text-sm font-medium text-white bg-gray-900 rounded-2xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" variant="white" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </section>
    </div>
  );
};

export default OnboardingPage;