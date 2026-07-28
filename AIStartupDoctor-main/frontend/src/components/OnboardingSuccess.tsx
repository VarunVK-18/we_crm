import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OnboardingSuccessProps {
  userName?: string;
  startupName?: string;
}

const OnboardingSuccess: React.FC<OnboardingSuccessProps> = ({ 
  userName, 
  startupName 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Startup Doctor!
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              {userName && `Hi ${userName},`} your account has been successfully set up.
            </p>
            {startupName && (
              <p className="text-gray-600">
                We're excited to help <span className="font-semibold text-gray-900">{startupName}</span> grow!
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete your first health check assessment</li>
              <li>• Explore your personalized dashboard</li>
              <li>• Get insights to grow your startup</li>
            </ul>
          </div>

          <Link
            to="/dashboard"
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;