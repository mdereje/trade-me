import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhotoIcon,
  StarIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { isPaymentRequiredError, itemsApi, tradesApi, usersApi } from '../services/api';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, openUpgradeModal } = useAuth();
  const itemId = Number(id);

  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedOfferedItemId, setSelectedOfferedItemId] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');
  const [offerError, setOfferError] = useState('');

  const {
    data: item,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['item-detail', itemId],
    queryFn: () => itemsApi.getItem(itemId),
    enabled: Number.isFinite(itemId) && itemId > 0,
  });

  const { data: ownerProfile } = useQuery({
    queryKey: ['public-user', item?.ownerId],
    queryFn: () => usersApi.getPublicProfile(item!.ownerId),
    enabled: Boolean(item?.ownerId),
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => itemsApi.getMyListings(),
    enabled: isAuthenticated && offerModalOpen,
  });

  const activeMyListings = myListings.filter((i) => i.status === 'active');

  const createOfferMutation = useMutation({
    mutationFn: () =>
      tradesApi.createOffer({
        itemId: item!.id,
        offeredItemId: Number(selectedOfferedItemId),
        message: offerMessage.trim() || undefined,
      }),
    onSuccess: () => {
      setOfferModalOpen(false);
      setOfferMessage('');
      setSelectedOfferedItemId('');
      setOfferError('');
      setOfferSuccess('Trade offer sent! You can track it under My Trades.');
    },
    onError: (err: any) => {
      if (isPaymentRequiredError(err)) {
        setOfferModalOpen(false);
        openUpgradeModal(err.message);
        return;
      }
      setOfferError(err?.message || 'Failed to send trade offer.');
    },
  });

  const handleOpenOffer = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/items/${itemId}`);
      return;
    }
    setOfferError('');
    setOfferModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="h-96 bg-secondary-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-secondary-200 rounded w-3/4" />
            <div className="h-4 bg-secondary-100 rounded w-1/2" />
            <div className="h-24 bg-secondary-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Item Not Found</h1>
          <p className="text-secondary-600 mb-6">
            This item may have been traded or removed by its owner.
          </p>
          <Link to="/items" className="btn-primary">
            Back to Browse Items
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = Boolean(user && user.id === item.ownerId);
  const activePhoto = item.photos[selectedPhotoIdx] || item.photos[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/items"
        className="inline-flex items-center text-sm text-secondary-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
        Back to Browse Items
      </Link>

      {offerSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 flex items-center justify-between">
          <span>{offerSuccess}</span>
          <Link to="/trades" className="font-semibold underline ml-4">
            View My Trades
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="mb-4 bg-secondary-100 rounded-lg overflow-hidden">
            {activePhoto ? (
              <img
                src={activePhoto.photoUrl}
                alt={item.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-secondary-200 flex items-center justify-center">
                <PhotoIcon className="w-16 h-16 text-secondary-400" />
              </div>
            )}
          </div>

          {item.photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {item.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhotoIdx(index)}
                  className={`rounded overflow-hidden border-2 ${
                    index === selectedPhotoIdx ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={photo.photoUrl}
                    alt={`${item.title} ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{item.category?.icon || '📦'}</span>
              <span className="text-sm text-secondary-600">{item.category?.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">{item.title}</h1>
            <div className="flex items-center text-secondary-600 mb-4">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>
                {item.city}, {item.state} {item.zipCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                {item.condition} Condition
              </span>
              {item.status !== 'active' && (
                <span className="bg-secondary-200 text-secondary-700 text-sm font-medium px-3 py-1 rounded-full capitalize">
                  {item.status}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-2">Description</h2>
            <p className="text-secondary-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Owner Info */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Item Owner</h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                <UserIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h4 className="font-medium text-secondary-900">
                  {item.owner.fullName}{' '}
                  <span className="text-secondary-500 text-sm">@{item.owner.username}</span>
                </h4>
                <div className="flex items-center text-sm text-secondary-600 mt-0.5">
                  <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                  <span>
                    {ownerProfile?.averageRating != null
                      ? ownerProfile.averageRating.toFixed(1)
                      : 'New trader'}
                  </span>
                  <span className="ml-1">
                    ({ownerProfile?.reviewsCount ?? 0} reviews ·{' '}
                    {ownerProfile?.tradesCompleted ?? 0} completed trades)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isOwner ? (
            <div className="rounded-lg bg-secondary-100 p-4 text-sm text-secondary-700">
              This is your listing. Manage it from your{' '}
              <Link to="/dashboard" className="text-primary-600 font-medium hover:underline">
                Dashboard
              </Link>
              .
            </div>
          ) : item.status === 'active' ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleOpenOffer}
                className="btn-primary w-full py-3 text-base"
              >
                {isAuthenticated ? 'Make Trade Offer' : 'Sign In to Make Trade Offer'}
              </button>
              <p className="text-xs text-center text-secondary-500">
                Trading requires a Trade Me Membership ($0.99/month or $10/year).
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary-100 p-4 text-sm text-secondary-600">
              This item is no longer available for trade.
            </div>
          )}
        </div>
      </div>

      {/* Make Trade Offer Modal */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setOfferModalOpen(false)}
              className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold text-secondary-900 mb-1">Make a Trade Offer</h2>
            <p className="text-sm text-secondary-600 mb-4">
              Propose one of your listed items in exchange for <strong>{item.title}</strong>.
            </p>

            {offerError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {offerError}
              </div>
            )}

            {activeMyListings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-secondary-600 mb-4">
                  You need at least one active item listed before you can propose a swap.
                </p>
                <Link
                  to="/create-item"
                  onClick={() => setOfferModalOpen(false)}
                  className="btn-primary inline-block"
                >
                  List Your First Item Free
                </Link>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedOfferedItemId) {
                    setOfferError('Please select one of your items to offer.');
                    return;
                  }
                  createOfferMutation.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Your Item to Offer *
                  </label>
                  <select
                    value={selectedOfferedItemId}
                    onChange={(e) => setSelectedOfferedItemId(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select one of your active items</option>
                    {activeMyListings.map((myItem) => (
                      <option key={myItem.id} value={myItem.id}>
                        {myItem.title} ({myItem.condition})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="input-field"
                    placeholder="Introduce your item or suggest a public meetup area..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOfferModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createOfferMutation.isPending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {createOfferMutation.isPending ? 'Sending...' : 'Send Trade Offer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
