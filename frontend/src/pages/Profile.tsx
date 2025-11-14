import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  StarIcon, 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Mock data - replace with actual API calls
  const stats = {
    itemsListed: 5,
    tradesCompleted: 12,
    averageRating: 4.8,
    reviewsCount: 15
  };

  const recentReviews = [
    {
      id: 1,
      reviewer: { name: 'John Doe', rating: 5 },
      comment: 'Great trade! Item was exactly as described.',
      createdAt: '2024-01-10T10:30:00Z'
    },
    {
      id: 2,
      reviewer: { name: 'Jane Smith', rating: 4 },
      comment: 'Smooth transaction, would trade again.',
      createdAt: '2024-01-08T15:20:00Z'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          My Profile
        </h1>
        <p className="text-secondary-600">
          Manage your profile and trading information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">
                Profile Information
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-secondary flex items-center space-x-2"
              >
                <PencilIcon className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900">
                    {user?.fullName}
                  </h3>
                  <p className="text-secondary-600">@{user?.username}</p>
                  <div className="flex items-center mt-1">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium text-secondary-700">
                      {stats.averageRating}
                    </span>
                    <span className="text-sm text-secondary-500 ml-1">
                      ({stats.reviewsCount} reviews)
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
                    <span className="text-secondary-900">{user?.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone
                  </label>
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 text-secondary-400 mr-2" />
                    <span className="text-secondary-900">
                      {user?.phoneNumber || 'Not provided'}
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
                      {user?.city && user?.state 
                        ? `${user.city}, ${user.state}` 
                        : 'Not provided'
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Member Since
                  </label>
                  <span className="text-secondary-900">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'
                    }
                  </span>
                </div>
              </div>

              {user?.bio && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Bio
                  </label>
                  <p className="text-secondary-900">{user.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Recent Reviews
            </h2>
            
            {recentReviews.length === 0 ? (
              <div className="text-center py-8">
                <StarIcon className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
                <p className="text-secondary-600">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map(review => (
                  <div key={review.id} className="border-b border-secondary-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-secondary-900">
                          {review.reviewer.name}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.reviewer.rating
                                  ? 'text-yellow-400'
                                  : 'text-secondary-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-secondary-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-secondary-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Trading Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-secondary-600">Items Listed</span>
                <span className="font-semibold text-secondary-900">{stats.itemsListed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Trades Completed</span>
                <span className="font-semibold text-secondary-900">{stats.tradesCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Average Rating</span>
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="font-semibold text-secondary-900">{stats.averageRating}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Reviews</span>
                <span className="font-semibold text-secondary-900">{stats.reviewsCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                List New Item
              </button>
              <button className="btn-secondary w-full">
                Browse Items
              </button>
              <button className="btn-secondary w-full">
                View My Items
              </button>
              <button className="btn-secondary w-full">
                View My Trades
              </button>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              Subscription
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Status</span>
                <span className="text-green-600 font-semibold">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Plan</span>
                <span className="font-semibold text-secondary-900">$1/week</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Next Billing</span>
                <span className="font-semibold text-secondary-900">Jan 25, 2024</span>
              </div>
              <button className="btn-secondary w-full text-sm">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
