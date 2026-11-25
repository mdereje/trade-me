import React from 'react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold text-secondary-900 mb-6">Terms of Service</h1>
    <div className="card space-y-4 text-secondary-700 leading-relaxed">
      <p>
        Trade Me is a peer-to-peer local barter marketplace. Members list personal items and
        negotiate direct item-for-item swaps without cash payments on the platform.
      </p>
      <h2 className="text-xl font-semibold text-secondary-900">Memberships & Billing</h2>
      <p>
        Browsing items and creating your first active listing are free. Paid Trade Me Memberships
        are billed via Stripe at $0.99/month or $10/year and renew automatically until cancelled.
        You may cancel at any time in one click from your Profile via the Stripe Billing Portal;
        access remains active through the end of your current billing period.
      </p>
      <h2 className="text-xl font-semibold text-secondary-900">Prohibited Items & Conduct</h2>
      <p>
        Users may not list illegal, stolen, hazardous, recalled, or counterfeit items. Trade Me is a
        venue connecting local traders and does not inspect or guarantee traded goods.
      </p>
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold text-secondary-900 mb-6">Privacy Policy</h1>
    <div className="card space-y-4 text-secondary-700 leading-relaxed">
      <p>
        We collect only the information needed to operate your Trade Me account: name, username,
        email, optional location, item listings, and trade history.
      </p>
      <h2 className="text-xl font-semibold text-secondary-900">Public vs. Private Data</h2>
      <p>
        Your email address and phone number are never exposed on public profile pages. Public
        listings display your username, display name, city/state, and trade ratings.
      </p>
      <h2 className="text-xl font-semibold text-secondary-900">Payments</h2>
      <p>
        All payment card details are processed exclusively by Stripe. Trade Me never stores raw
        payment card numbers.
      </p>
    </div>
  </div>
);

export const SafetyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold text-secondary-900 mb-6">Local Trading Safety Tips</h1>
    <div className="card space-y-4 text-secondary-700 leading-relaxed">
      <ul className="list-disc pl-5 space-y-2">
        <li>Always meet in a well-lit public place (coffee shop, police station exchange zone, or shopping center).</li>
        <li>Inspect items thoroughly before marking a trade complete.</li>
        <li>Check trader profiles and past reviews before agreeing to meet.</li>
        <li>Never share sensitive personal or financial information outside the platform.</li>
      </ul>
      <div className="pt-4">
        <Link to="/items" className="btn-primary inline-block">
          Browse Local Items
        </Link>
      </div>
    </div>
  </div>
);
