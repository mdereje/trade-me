import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  BellIcon,
  PlusIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { itemsApi, tradesApi, usersApi } from '../services/api';

const Dashboard: React.FC = () => {
  const { user, subscription } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => usersApi.getMe(),
  });

  const { data: myItems = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => itemsApi.getMyListings(),
  });

  const { data: receivedOffers = [] } = useQuery({
    queryKey: ['offers-received'],
    queryFn: () => tradesApi.getReceivedOffers(),
  });

  const { data: activeTrades = [] } = useQuery({
    queryKey: ['trades-active'],
    queryFn: () => tradesApi.getActiveTrades(),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => itemsApi.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['browse-items'] });
    },
  });

  const pendingOffers = receivedOffers.filter((o) => o.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            Welcome back, {profile?.fullName || user?.fullName}!
          </h1>
          <p className="text-secondary-600 mt-1">
            Here is what is happening with your items and trades.
          </p>
        </div>

        {!subscription?.isActive && (
          <Link
            to="/pricing"
            className="inline-flex items-center space-x-2 bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Upgrade to Unlimited Trading ($0.99/mo · $10/yr)</span>
          </Link>
        )}
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
              <p className="text-secondary-600 text-sm">Add an item to trade</p>
            </div>
          </div>
        </Link>

        <Link to="/items" className="card hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <ShoppingBagIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-secondary-900">Browse Items</h3>
              <p className="text-secondary-600 text-sm">Find items nearby</p>
            </div>
          </div>
        </Link>

        <Link to="/trades" className="card hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <ArrowPathIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-secondary-900">My Trades</h3>
              <p className="text-secondary-600 text-sm">
                {pendingOffers.length} pending offers · {activeTrades.length} active
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {profile?.itemsCount ?? myItems.filter((i) => i.status === 'active').length}
          </div>
          <div className="text-secondary-600 text-sm">Active Items</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{activeTrades.length}</div>
          <div className="text-secondary-600 text-sm">Active Trades</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {profile?.tradesCompleted ?? 0}
          </div>
          <div className="text-secondary-600 text-sm">Completed Trades</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {profile?.reviewsCount ?? 0}
          </div>
          <div className="text-secondary-600 text-sm">Reviews Received</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Listed Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Your Items</h2>
            <Link to="/create-item" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              + Add Item
            </Link>
          </div>
          {myItems.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
              <p>No items listed yet</p>
              <Link to="/create-item" className="btn-primary mt-4 inline-block">
                List Your First Item Free
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-secondary-200 rounded-lg p-3"
                >
                  <Link to={`/items/${item.id}`} className="flex items-center space-x-3 min-w-0">
                    {item.photos[0] ? (
                      <img
                        src={item.photos[0].photoUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-secondary-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingBagIcon className="w-6 h-6 text-secondary-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-secondary-900 truncate">{item.title}</div>
                      <div className="text-xs text-secondary-500 capitalize">
                        {item.condition} · {item.status}
                      </div>
                    </div>
                  </Link>
                  {item.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      className="text-secondary-400 hover:text-red-600 p-1.5"
                      title="Delete item"
                      aria-label={`Delete ${item.title}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Trade Offers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Received Trade Offers</h2>
            <Link to="/trades" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              Manage All
            </Link>
          </div>
          {receivedOffers.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              <BellIcon className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
              <p>No trade offers yet</p>
              <p className="text-sm mt-1">Browse items to propose your first swap!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedOffers.slice(0, 5).map((offer) => (
                <Link
                  key={offer.id}
                  to="/trades"
                  className="block border border-secondary-200 rounded-lg p-3 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-secondary-900 text-sm">
                      {offer.offerer.fullName} offered {offer.offeredItem.title}
                    </span>
                    <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700">
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600">For your {offer.item.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
