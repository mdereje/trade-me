import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { paymentsApi } from '../services/api';

const Pricing: React.FC = () => {
  const { isAuthenticated, subscription } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<'annual' | 'monthly' | null>(null);
  const [error, setError] = useState('');

  const { data: plansData } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: () => paymentsApi.getPlans(),
  });

  const handleSubscribe = async (plan: 'annual' | 'monthly') => {
    setError('');
    if (!isAuthenticated) {
      navigate('/register?redirect=/pricing');
      return;
    }

    if (subscription?.isActive) {
      setLoadingPlan(plan);
      try {
        const { portalUrl } = await paymentsApi.createPortal();
        window.location.href = portalUrl;
      } catch (err: any) {
        setError(err?.message || 'Unable to open billing portal.');
        setLoadingPlan(null);
      }
      return;
    }

    setLoadingPlan(plan);
    try {
      const { checkoutUrl } = await paymentsApi.createCheckout(plan);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err?.message || 'Unable to start Stripe Checkout right now.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center mb-12">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-700 mb-4">
          <SparklesIcon className="w-4 h-4 mr-1.5" />
          Simple, Transparent Pricing
        </span>
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">
          Browse Free. Trade Unlimited for Less Than $1/mo.
        </h1>
        <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
          Explore local items and list your first item for free. Upgrade anytime to unlock unlimited
          listings, trade offers, and counter-offers.
        </p>
      </div>

      {error && (
        <div className="max-w-xl mx-auto mb-8 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {plansData && !plansData.stripeConfigured && (
        <div className="max-w-xl mx-auto mb-8 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Payments are being finalized. You can browse items and list your first item for free now.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Free Tier */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-secondary-900 mb-1">Free</h2>
            <p className="text-sm text-secondary-600 mb-4">Browse the local marketplace</p>
            <div className="text-4xl font-bold text-secondary-900 mb-6">
              $0<span className="text-base font-normal text-secondary-500">/forever</span>
            </div>
            <ul className="space-y-3 text-sm text-secondary-700 mb-6">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Unlimited browsing & local search
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                View item photos, profiles & reviews
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                List 1 active item to get started
              </li>
            </ul>
          </div>
          <Link to="/items" className="btn-secondary w-full text-center py-2.5">
            Browse Items Free
          </Link>
        </div>

        {/* Annual Tier (Highlighted / Best Value) */}
        <div className="card border-2 border-primary-600 ring-2 ring-primary-100 flex flex-col justify-between relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Best Value · Save 16%
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary-900 mb-1">Annual Member</h2>
            <p className="text-sm text-secondary-600 mb-4">Just $0.83/month billed yearly</p>
            <div className="text-4xl font-bold text-secondary-900 mb-6">
              $10<span className="text-base font-normal text-secondary-500">/year</span>
            </div>
            <ul className="space-y-3 text-sm text-secondary-700 mb-6">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Everything in Free
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Unlimited active item listings
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Send, accept & counter trade offers
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                1-click self-serve cancellation
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => handleSubscribe('annual')}
            disabled={loadingPlan !== null}
            className="btn-primary w-full py-2.5 disabled:opacity-50"
          >
            {loadingPlan === 'annual'
              ? 'Redirecting...'
              : subscription?.isActive
              ? 'Manage Membership'
              : 'Choose Annual — $10/yr'}
          </button>
        </div>

        {/* Monthly Tier */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-secondary-900 mb-1">Monthly Member</h2>
            <p className="text-sm text-secondary-600 mb-4">Flexible month-to-month plan</p>
            <div className="text-4xl font-bold text-secondary-900 mb-6">
              $0.99<span className="text-base font-normal text-secondary-500">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-secondary-700 mb-6">
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Everything in Free
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Unlimited active item listings
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Send, accept & counter trade offers
              </li>
              <li className="flex items-start">
                <CheckIcon className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
                Cancel anytime with zero lock-in
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => handleSubscribe('monthly')}
            disabled={loadingPlan !== null}
            className="btn-secondary w-full py-2.5 disabled:opacity-50"
          >
            {loadingPlan === 'monthly'
              ? 'Redirecting...'
              : subscription?.isActive
              ? 'Manage Membership'
              : 'Choose Monthly — $0.99/mo'}
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-secondary-500 flex items-center justify-center space-x-2">
        <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
        <span>Secure checkout powered by Stripe. Supports Cards, Apple Pay, Google Pay, and Link.</span>
      </div>
    </div>
  );
};

export default Pricing;
