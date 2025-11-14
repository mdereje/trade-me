import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ShoppingBagIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Trade Me</span>
            </div>
            <p className="text-secondary-300 mb-4">
              Trade your everyday items with others in your community. 
              No money needed - just find what you want and trade what you have.
            </p>
            <p className="text-secondary-400 text-sm">
              Only $1/week subscription • Cancel anytime
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/items" className="text-secondary-300 hover:text-white transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-secondary-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/trades" className="text-secondary-300 hover:text-white transition-colors">
                  My Trades
                </Link>
              </li>
              <li>
                <Link to="/create-item" className="text-secondary-300 hover:text-white transition-colors">
                  List Item
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <button className="text-secondary-300 hover:text-white transition-colors">
                  Help Center
                </button>
              </li>
              <li>
                <button className="text-secondary-300 hover:text-white transition-colors">
                  Safety Tips
                </button>
              </li>
              <li>
                <button className="text-secondary-300 hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button className="text-secondary-300 hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-400 text-sm">
              © 2024 Trade Me. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-secondary-400 hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button className="text-secondary-400 hover:text-white transition-colors">
                Cookie Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
