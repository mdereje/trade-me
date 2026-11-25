import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  PhotoIcon,
  StarIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { isPaymentRequiredError, reviewsApi, tradesApi } from '../services/api';
import { Trade } from '../types';

const Trades: React.FC = () => {
  const { user, openUpgradeModal } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'received' | 'made' | 'trades'>('received');
  const [actionError, setActionError] = useState('');
  const [reviewTrade, setReviewTrade] = useState<Trade | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const { data: receivedOffers = [] } = useQuery({
    queryKey: ['offers-received'],
    queryFn: () => tradesApi.getReceivedOffers(),
  });

  const { data: madeOffers = [] } = useQuery({
    queryKey: ['offers-made'],
    queryFn: () => tradesApi.getMadeOffers(),
  });

  const { data: tradeHistory = [] } = useQuery({
    queryKey: ['trades-history'],
    queryFn: () => tradesApi.getTradeHistory(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['offers-received'] });
    queryClient.invalidateQueries({ queryKey: ['offers-made'] });
    queryClient.invalidateQueries({ queryKey: ['trades-active'] });
    queryClient.invalidateQueries({ queryKey: ['trades-history'] });
    queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    queryClient.invalidateQueries({ queryKey: ['browse-items'] });
  };

  const acceptMutation = useMutation({
    mutationFn: (offerId: number) => tradesApi.acceptOffer(offerId),
    onSuccess: () => {
      setActionError('');
      invalidateAll();
      setActiveTab('trades');
    },
    onError: (err: any) => {
      if (isPaymentRequiredError(err)) {
        openUpgradeModal(err.message);
        return;
      }
      setActionError(err?.message || 'Failed to accept offer.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (offerId: number) => tradesApi.rejectOffer(offerId),
    onSuccess: () => {
      setActionError('');
      invalidateAll();
    },
    onError: (err: any) => setActionError(err?.message || 'Failed to reject offer.'),
  });

  const completeMutation = useMutation({
    mutationFn: (tradeId: number) => tradesApi.completeTrade(tradeId),
    onSuccess: () => {
      setActionError('');
      invalidateAll();
    },
    onError: (err: any) => setActionError(err?.message || 'Failed to complete trade.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (tradeId: number) => tradesApi.cancelTrade(tradeId),
    onSuccess: () => {
      setActionError('');
      invalidateAll();
    },
    onError: (err: any) => setActionError(err?.message || 'Failed to cancel trade.'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!reviewTrade || !user) throw new Error('Missing trade context');
      const revieweeId =
        reviewTrade.user1Id === user.id ? reviewTrade.user2Id : reviewTrade.user1Id;
      return reviewsApi.createReview({
        tradeId: reviewTrade.id,
        revieweeId,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim() || undefined,
      });
    },
    onSuccess: () => {
      setReviewTrade(null);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setReviewSuccess('Review submitted! Thank you for building community trust.');
      invalidateAll();
    },
    onError: (err: any) => setActionError(err?.message || 'Could not submit review.'),
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-secondary-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Trades</h1>
        <p className="text-secondary-600">
          Manage incoming offers, outgoing offers, and active or completed trades.
        </p>
      </div>

      {actionError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {reviewSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {reviewSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Received Offers ({receivedOffers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('made')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'made'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Offers Made ({madeOffers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trades')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trades'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Trades ({tradeHistory.length})
          </button>
        </nav>
      </div>

      {/* Received Offers */}
      {activeTab === 'received' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">Received Trade Offers</h2>
            <div className="flex items-center space-x-2 text-sm text-secondary-600">
              <BellIcon className="w-5 h-5 text-secondary-400" />
              <span>
                {receivedOffers.filter((o) => o.status === 'pending').length} pending
              </span>
            </div>
          </div>

          {receivedOffers.length === 0 ? (
            <div className="card text-center py-12">
              <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No received offers yet
              </h3>
              <p className="text-secondary-600 mb-4">
                List items with clear photos to attract local trade offers.
              </p>
              <Link to="/create-item" className="btn-primary inline-block">
                List an Item
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedOffers.map((offer) => (
                <div key={offer.id} className="card">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-secondary-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {offer.offeredItem.photos[0] ? (
                        <img
                          src={offer.offeredItem.photos[0].photoUrl}
                          alt={offer.offeredItem.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="w-8 h-8 text-secondary-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-secondary-900">
                          {offer.offerer.fullName} offered{' '}
                          <span className="text-primary-600">{offer.offeredItem.title}</span>
                        </h3>
                        <div className="flex items-center space-x-1.5">
                          {getStatusIcon(offer.status)}
                          <span className="text-sm font-medium text-secondary-600 capitalize">
                            {offer.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-secondary-600 text-sm mt-1">
                        In exchange for your <strong>{offer.item.title}</strong>
                      </p>
                      {offer.message && (
                        <p className="text-secondary-700 mt-2 italic text-sm">"{offer.message}"</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-secondary-500">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                        {offer.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => acceptMutation.mutate(offer.id)}
                              disabled={acceptMutation.isPending}
                              className="btn-primary text-sm px-4 py-1.5"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectMutation.mutate(offer.id)}
                              disabled={rejectMutation.isPending}
                              className="btn-secondary text-sm px-4 py-1.5"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Made Offers */}
      {activeTab === 'made' && (
        <div>
          {madeOffers.length === 0 ? (
            <div className="card text-center py-12">
              <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No offers made yet
              </h3>
              <p className="text-secondary-600 mb-4">
                Browse local items and propose a swap with something you own.
              </p>
              <Link to="/items" className="btn-primary inline-block">
                Browse Items
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {madeOffers.map((offer) => (
                <div key={offer.id} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-secondary-900">
                        You offered <strong>{offer.offeredItem.title}</strong> for{' '}
                        <Link
                          to={`/items/${offer.item.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {offer.item.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-secondary-600 mt-0.5">
                        Owner: {offer.itemOwner.fullName} (@{offer.itemOwner.username})
                      </p>
                      {offer.message && (
                        <p className="text-sm text-secondary-700 italic mt-2">"{offer.message}"</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {getStatusIcon(offer.status)}
                      <span className="text-sm font-medium capitalize text-secondary-600">
                        {offer.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active & Historical Trades */}
      {activeTab === 'trades' && (
        <div>
          {tradeHistory.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No trades yet</h3>
              <p className="text-secondary-600">
                When a trade offer is accepted, your trade will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tradeHistory.map((trade) => {
                const partner = user && trade.user1Id === user.id ? trade.user2 : trade.user1;
                return (
                  <div key={trade.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-semibold text-secondary-900">
                            {trade.item1.title} ⇄ {trade.item2.title}
                          </div>
                          <div className="text-sm text-secondary-600">
                            Trading with {partner.fullName} (@{partner.username}) ·{' '}
                            {new Date(trade.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(trade.status)}
                        <span className="text-sm font-medium capitalize text-secondary-700">
                          {trade.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end space-x-2">
                      {trade.status === 'accepted' && (
                        <>
                          <button
                            type="button"
                            onClick={() => completeMutation.mutate(trade.id)}
                            disabled={completeMutation.isPending}
                            className="btn-primary text-sm px-4 py-1.5"
                          >
                            Mark Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelMutation.mutate(trade.id)}
                            disabled={cancelMutation.isPending}
                            className="btn-secondary text-sm px-4 py-1.5"
                          >
                            Cancel Trade
                          </button>
                        </>
                      )}
                      {trade.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setReviewTrade(trade)}
                          className="btn-secondary text-sm px-4 py-1.5 inline-flex items-center space-x-1"
                        >
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                          <span>Leave Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Leave Review Modal */}
      {reviewTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setReviewTrade(null)}
              className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
              aria-label="Close review modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Leave a Trade Review</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                reviewMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Rating (1–5 Stars)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${
                        reviewRating >= star
                          ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                          : 'border-secondary-200 text-secondary-400'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Headline *
                </label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="input-field"
                  placeholder="Smooth and friendly swap!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Comment
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="input-field"
                  placeholder="Share how the item condition and meetup went..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewTrade(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="btn-primary disabled:opacity-50"
                >
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trades;
