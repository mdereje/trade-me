import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShoppingBagIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
              Trade Your Way to
              <span className="text-primary-600"> Better Items</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Trade your everyday items with others in your community. 
              No money needed - just find what you want and trade what you have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                    Go to Dashboard
                  </Link>
                  <Link to="/items" className="btn-secondary text-lg px-8 py-3">
                    Browse Items
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Get Started Free
                  </Link>
                  <Link to="/items" className="btn-secondary text-lg px-8 py-3">
                    Browse Items
                  </Link>
                </>
              )}
            </div>
            <p className="text-sm text-secondary-500 mt-4">
              Only $1/week • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose Trade Me?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              A modern platform designed for safe, easy, and fun trading experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                No Money Exchange
              </h3>
              <p className="text-secondary-600">
                Trade items directly without any financial transactions. 
                Just $1/week subscription to access the platform.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Local Trading
              </h3>
              <p className="text-secondary-600">
                Find items in your area. Filter by zip code, city, or radius 
                to discover nearby trading opportunities.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Safe & Secure
              </h3>
              <p className="text-secondary-600">
                Social media authentication and phone verification ensure 
                you're trading with real people in your community.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowPathIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Easy Trading
              </h3>
              <p className="text-secondary-600">
                Make offers, counter-offers, and negotiate trades directly 
                through our intuitive platform.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Review System
              </h3>
              <p className="text-secondary-600">
                Rate and review your trading experiences to build trust 
                and help others make informed decisions.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Multiple Categories
              </h3>
              <p className="text-secondary-600">
                From electronics to furniture, books to tools - 
                find and trade items across all categories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Sign Up & Verify
              </h3>
              <p className="text-secondary-600">
                Create your account with social media login and verify your phone number for security.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                List Your Items
              </h3>
              <p className="text-secondary-600">
                Upload photos and details of items you want to trade. 
                Set your location and browse items from others.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                Trade & Review
              </h3>
              <p className="text-secondary-600">
                Make offers, negotiate trades, and meet up to exchange items. 
                Leave reviews to build your trading reputation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of people already trading their way to better items.
          </p>
          {!isAuthenticated && (
            <Link 
              to="/register" 
              className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
