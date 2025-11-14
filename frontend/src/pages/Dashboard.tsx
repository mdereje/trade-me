import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  ShoppingBagIcon, 
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-secondary-600 mt-2">
          Here's what's happening with your trades and items.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/create-item"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <PlusIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-secondary-900">List New Item</h3>
              <p className="text-secondary-600">Add an item to trade</p>
            </div>
          </div>
        </Link>

        <Link
          to="/items"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <ShoppingBagIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-secondary-900">Browse Items</h3>
              <p className="text-secondary-600">Find items to trade</p>
            </div>
          </div>
        </Link>

        <Link
          to="/trades"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <ArrowPathIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-secondary-900">My Trades</h3>
              <p className="text-secondary-600">View active trades</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">0</div>
          <div className="text-secondary-600">Items Listed</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">0</div>
          <div className="text-secondary-600">Active Trades</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">0</div>
          <div className="text-secondary-600">Completed Trades</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">0</div>
          <div className="text-secondary-600">Reviews Received</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Recent Items</h2>
            <Link to="/items" className="text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="text-center py-8 text-secondary-500">
            <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
            <p>No items listed yet</p>
            <Link to="/create-item" className="btn-primary mt-4 inline-block">
              List Your First Item
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Trade Offers</h2>
            <Link to="/trades" className="text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="text-center py-8 text-secondary-500">
            <BellIcon className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
            <p>No trade offers yet</p>
            <p className="text-sm">Start browsing items to make offers!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
