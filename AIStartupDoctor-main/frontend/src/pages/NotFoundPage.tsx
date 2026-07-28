import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-all text-sm font-medium inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}