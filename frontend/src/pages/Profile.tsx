import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EnvelopeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { paymentsApi, reviewsApi, usersApi } from '../services/api';

const Profile: React.FC = () => {
  const { user, subscription, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => usersApi.getMe(),
  });

  const activeUser = profile || user;

  const { data: recentReviews = [] } = useQuery({
    queryKey: ['user-reviews', activeUser?.id],
    queryFn: () => reviewsApi.getUserReviews(activeUser!.id),
    enabled: Boolean(activeUser?.id),
  });

  const [formState, setFormState] = useState({
    fullName: activeUser?.fullName || '',
    phoneNumber: activeUser?.phoneNumber || '',
    city: activeUser?.city || '',
    state: activeUser?.state || '',
    zipCode: activeUser?.zipCode || '',
    bio: activeUser?.bio || '',
  });

  const startEditing = () => {
    setFormState({
      fullName: activeUser?.fullName || '',
      phoneNumber: activeUser?.phoneNumber || '',
      city: activeUser?.city || '',
      state: activeUser?.state || '',
      zipCode: activeUser?.zipCode || '',
      bio: activeUser?.bio || '',
    });
    setIsEditing(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: () => usersApi.updateMe(formState),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      await refreshUser();
      setIsEditing(false);
    },
  });

  const handleOpenPortal = async () => {
    setPortalError('');
    setPortalLoading(true);
    try {
      const { portalUrl } = await paymentsApi.createPortal();
      window.location.href = portalUrl;
    } catch (err: any) {
      setPortalError(err?.message || 'Unable to open Stripe Billing Portal.');
      setPortalLoading(false);
    }
  };

  const planLabel =
    subscription?.planType === 'annual'
      ? '$10/year'
      : subscription?.planType === 'monthly'
      ? '$0.99/month'
      : 'Free Plan';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Profile</h1>
        <p className="text-secondary-600">
          Manage your profile, trading stats, and membership billing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">Profile Information</h2>
              <button
                type="button"
                onClick={() => (isEditing ? setIsEditing(false) : startEditing())}
                className="btn-secondary flex items-center space-x-2"
              >
                <PencilIcon className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formState.phoneNumber}
                    onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formState.city}
                      onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formState.state}
                      onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={formState.zipCode}
                      onChange={(e) => setFormState({ ...formState, zipCode: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={formState.bio}
                    onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
                    className="input-field"
                    placeholder="Tell neighbors what kinds of items you like to trade..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-secondary-900">
                      {activeUser?.fullName}
                    </h3>
                    <p className="text-secondary-600">@{activeUser?.username}</p>
                    <div className="flex items-center mt-1">
                      <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-secondary-700">
                        {activeUser?.averageRating != null
                          ? activeUser.averageRating.toFixed(1)
                          : 'No ratings yet'}
                      </span>
                      <span className="text-sm text-secondary-500 ml-1">
                        ({activeUser?.reviewsCount ?? 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 text-secondary-400 mr-2" />
                      <span className="text-secondary-900">{activeUser?.email}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Phone
                    </label>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 text-secondary-400 mr-2" />
                      <span className="text-secondary-900">
                        {activeUser?.phoneNumber || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Location
                    </label>
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 text-secondary-400 mr-2" />
                      <span className="text-secondary-900">
                        {activeUser?.city && activeUser?.state
                          ? `${activeUser.city}, ${activeUser.state}`
                          : 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Member Since
                    </label>
                    <span className="text-secondary-900">
                      {activeUser?.createdAt
                        ? new Date(activeUser.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>

                {activeUser?.bio && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Bio</label>
                    <p className="text-secondary-900">{activeUser.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Recent Reviews</h2>

            {recentReviews.length === 0 ? (
              <div className="text-center py-8">
                <StarIcon className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                <p className="text-secondary-600">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-secondary-200 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-secondary-900">
                          {review.isAnonymous
                            ? 'Anonymous Trader'
                            : review.reviewer?.fullName || 'Trader'}
                        </span>
                        <span className="text-sm text-yellow-600 font-semibold">
                          {'★'.repeat(review.rating)}
                        </span>
                      </div>
                      <span className="text-xs text-secondary-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-secondary-900">{review.title}</p>
                    {review.comment && (
                      <p className="text-secondary-700 text-sm mt-1">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Trading Stats</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Active Items</span>
                <span className="font-semibold text-secondary-900">
                  {activeUser?.itemsCount ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Trades Completed</span>
                <span className="font-semibold text-secondary-900">
                  {activeUser?.tradesCompleted ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Average Rating</span>
                <span className="font-semibold text-secondary-900">
                  {activeUser?.averageRating != null ? activeUser.averageRating.toFixed(1) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Reviews</span>
                <span className="font-semibold text-secondary-900">
                  {activeUser?.reviewsCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Membership & Billing */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Membership</h2>
            {portalError && (
              <div className="mb-3 rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {portalError}
              </div>
            )}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Status</span>
                <span
                  className={`font-semibold capitalize ${
                    subscription?.isActive ? 'text-green-600' : 'text-secondary-700'
                  }`}
                >
                  {subscription?.isActive
                    ? subscription.cancelAtPeriodEnd
                      ? 'Cancels at Period End'
                      : subscription.status
                    : 'Free'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Plan</span>
                <span className="font-semibold text-secondary-900">{planLabel}</span>
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-secondary-600">
                    {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing'}
                  </span>
                  <span className="font-semibold text-secondary-900">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscription?.isActive ? (
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="btn-secondary w-full text-sm mt-2 disabled:opacity-50"
                >
                  {portalLoading ? 'Opening Portal...' : 'Manage Subscription'}
                </button>
              ) : (
                <Link to="/pricing" className="btn-primary w-full text-center block text-sm mt-2">
                  Upgrade ($0.99/mo · $10/yr)
                </Link>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/create-item" className="btn-primary w-full block text-center">
                List New Item
              </Link>
              <Link to="/items" className="btn-secondary w-full block text-center">
                Browse Items
              </Link>
              <Link to="/trades" className="btn-secondary w-full block text-center">
                View My Trades
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
