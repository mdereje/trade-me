import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export const BillingSuccess: React.FC = () => {
  const { refreshSubscription, subscription } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const status = await refreshSubscription();
      attempts += 1;
      if (status?.isActive || attempts >= 5) {
        setChecking(false);
        return;
      }
      timer = setTimeout(poll, 1500);
    };
    poll();
    return () => clearTimeout(timer);
  }, [refreshSubscription]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="card">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Welcome to Trade Me Membership!
        </h1>
        <p className="text-secondary-600 mb-6">
          {checking
            ? 'Confirming your subscription with Stripe...'
            : subscription?.isActive
            ? 'Your membership is active. You now have unlimited listings and trading access.'
            : 'Payment received! Your membership status will activate within moments.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/items" className="btn-primary px-6 py-2.5">
            Browse Items
          </Link>
          <Link to="/dashboard" className="btn-secondary px-6 py-2.5">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export const BillingCancel: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="card">
        <XCircleIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">Checkout Cancelled</h1>
        <p className="text-secondary-600 mb-6">
          No charge was made. You can continue browsing items for free or subscribe whenever you are
          ready to start trading.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/pricing" className="btn-primary px-6 py-2.5">
            View Plans
          </Link>
          <Link to="/items" className="btn-secondary px-6 py-2.5">
            Browse Items
          </Link>
        </div>
      </div>
    </div>
  );
};
