import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowPathIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

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
              Trade everyday items with neighbors in your community. No cash needed — browse
              listings for free, find what you want, and swap what you have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/items" className="btn-primary text-lg px-8 py-3">
                Browse Items Free
              </Link>
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-secondary text-lg px-8 py-3">
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/register" className="btn-secondary text-lg px-8 py-3">
                  Sign Up Free
                </Link>
              )}
            </div>
            <p className="text-sm text-secondary-500 mt-4">
              Free to browse & list your first item • Unlimited trading for{' '}
              <Link to="/pricing" className="text-primary-600 font-medium hover:underline">
                $0.99/month or $10/year
              </Link>
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
              A modern barter platform designed for safe, local, money-free trading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Money Exchange</h3>
              <p className="text-secondary-600">
                Swap items directly without negotiating prices. Browse free, and unlock unlimited
                trading for $0.99/month or $10/year.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Local Trading</h3>
              <p className="text-secondary-600">
                Discover items right in your neighborhood. Filter by ZIP code, city, state, or
                category with zero sign-up required to browse.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Safe & Transparent</h3>
              <p className="text-secondary-600">
                Private contact details stay protected while public profiles showcase verified trade
                counts and community ratings.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowPathIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Easy Trading</h3>
              <p className="text-secondary-600">
                Propose offers from your listed items, review incoming swaps, and track active
                trades from offer to completion.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Review System</h3>
              <p className="text-secondary-600">
                Rate and review completed trades to build your local trading reputation and help
                others trade with confidence.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBagIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Multiple Categories</h3>
              <p className="text-secondary-600">
                From electronics to furniture, books to tools and musical instruments — trade across
                10 everyday categories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">How It Works</h2>
            <p className="text-xl text-secondary-600">Get started in just three steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Browse Free</h3>
              <p className="text-secondary-600">
                Explore items available in your area immediately — search by keyword, category, or
                location.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">List Your Items</h3>
              <p className="text-secondary-600">
                Create a free account and list your first item with photos. Upgrade for $0.99/mo or
                $10/yr for unlimited listings and offers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Trade & Review</h3>
              <p className="text-secondary-600">
                Send offers, meet safely in public to exchange items, mark trades complete, and
                leave a review.
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
            Browse local items right now for free, or join with an annual membership for just
            $10/year.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/items"
              className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
            >
              Browse Items
            </Link>
            <Link
              to="/pricing"
              className="border border-white text-white hover:bg-primary-700 font-medium py-3 px-8 rounded-lg transition-colors duration-200 text-lg"
            >
              See Pricing ($0.99/mo · $10/yr)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
