import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { paymentsApi } from '../services/api';

const UpgradeModal: React.FC = () => {
  const { upgradeModalOpen, upgradeModalMessage, closeUpgradeModal, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!upgradeModalOpen) return null;

  const handleCheckout = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { checkoutUrl } = await paymentsApi.createCheckout(selectedPlan);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err?.message || 'Unable to start checkout right now.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          type="button"
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
          aria-label="Close upgrade dialog"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-2 text-primary-600 mb-2">
          <SparklesIcon className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Trade Me Membership
          </span>
        </div>

        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Unlock Unlimited Trading
        </h2>
        <p className="text-secondary-600 text-sm mb-5">{upgradeModalMessage}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setSelectedPlan('annual')}
            className={`text-left p-4 rounded-lg border-2 transition-colors ${
              selectedPlan === 'annual'
                ? 'border-primary-600 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-secondary-900">Annual</span>
              <span className="text-xs font-semibold bg-primary-600 text-white px-2 py-0.5 rounded-full">
                Save 16%
              </span>
            </div>
            <div className="text-2xl font-bold text-secondary-900">$10/yr</div>
            <div className="text-xs text-secondary-600 mt-1">Just $0.83/month</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={`text-left p-4 rounded-lg border-2 transition-colors ${
              selectedPlan === 'monthly'
                ? 'border-primary-600 bg-primary-50'
                : 'border-secondary-200 hover:border-secondary-300'
            }`}
          >
            <div className="font-semibold text-secondary-900 mb-1">Monthly</div>
            <div className="text-2xl font-bold text-secondary-900">$0.99/mo</div>
            <div className="text-xs text-secondary-600 mt-1">Flexible · Cancel anytime</div>
          </button>
        </div>

        <ul className="space-y-2 text-sm text-secondary-700 mb-6">
          <li className="flex items-center">
            <CheckIcon className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
            Send, accept, and negotiate unlimited trade offers
          </li>
          <li className="flex items-center">
            <CheckIcon className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
            List unlimited active items with up to 5 photos each
          </li>
          <li className="flex items-center">
            <CheckIcon className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0" />
            Self-serve 1-click cancellation via Stripe Billing Portal
          </li>
        </ul>

        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50"
            >
              {submitting
                ? 'Redirecting to Stripe...'
                : `Continue with ${selectedPlan === 'annual' ? '$10/year' : '$0.99/month'}`}
            </button>
            <Link
              to="/pricing"
              onClick={closeUpgradeModal}
              className="btn-secondary text-center py-2.5"
            >
              Compare Plans
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register?redirect=/pricing"
              onClick={closeUpgradeModal}
              className="btn-primary flex-1 text-center py-2.5"
            >
              Create Account to Subscribe
            </Link>
            <Link
              to="/login?redirect=/pricing"
              onClick={closeUpgradeModal}
              className="btn-secondary text-center py-2.5"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;
