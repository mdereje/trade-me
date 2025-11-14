import React, { useState } from 'react';
import { 
  ArrowPathIcon, 
  BellIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Trades: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'offers' | 'trades'>('offers');

  // Mock data - replace with actual API calls
  const tradeOffers = [
    {
      id: 1,
      type: 'received',
      item: { title: 'Vintage Wooden Chair', photo: '/api/placeholder/100/100' },
      offeredItem: { title: 'Modern Coffee Table', photo: '/api/placeholder/100/100' },
      offerer: { name: 'John Doe', rating: 4.5 },
      status: 'pending',
      message: 'I have a modern coffee table that would look great with your chair!',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      type: 'made',
      item: { title: 'Gaming Laptop', photo: '/api/placeholder/100/100' },
      offeredItem: { title: 'MacBook Pro', photo: '/api/placeholder/100/100' },
      offerer: { name: 'You', rating: null },
      status: 'pending',
      message: 'Would you be interested in trading your MacBook for my gaming laptop?',
      createdAt: '2024-01-14T15:20:00Z'
    }
  ];

  const activeTrades = [
    {
      id: 1,
      item1: { title: 'Vintage Camera', photo: '/api/placeholder/100/100' },
      item2: { title: 'Guitar', photo: '/api/placeholder/100/100' },
      user: { name: 'Jane Smith', rating: 4.8 },
      status: 'accepted',
      createdAt: '2024-01-10T09:15:00Z'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          My Trades
        </h1>
        <p className="text-secondary-600">
          Manage your trade offers and active trades.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('offers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'offers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Trade Offers
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trades'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Active Trades
          </button>
        </nav>
      </div>

      {/* Trade Offers */}
      {activeTab === 'offers' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Trade Offers
            </h2>
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-secondary-400" />
              <span className="text-sm text-secondary-600">
                {tradeOffers.filter(offer => offer.status === 'pending').length} pending
              </span>
            </div>
          </div>

          {tradeOffers.length === 0 ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No trade offers yet
              </h3>
              <p className="text-secondary-600">
                Start browsing items to make offers or list your own items to receive offers.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {tradeOffers.map(offer => (
                <div key={offer.id} className="card">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={offer.item.photo}
                        alt={offer.item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-secondary-900">
                          {offer.type === 'received' ? 'Offer Received' : 'Offer Made'}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(offer.status)}
                          <span className="text-sm font-medium text-secondary-600">
                            {getStatusText(offer.status)}
                          </span>
                        </div>
                      </div>
                      <p className="text-secondary-600 mt-1">
                        {offer.type === 'received' 
                          ? `${offer.offerer.name} wants to trade their ${offer.offeredItem.title} for your ${offer.item.title}`
                          : `You offered your ${offer.offeredItem.title} for ${offer.item.title}`
                        }
                      </p>
                      {offer.message && (
                        <p className="text-secondary-700 mt-2 italic">
                          "{offer.message}"
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-secondary-500">
                            {new Date(offer.createdAt).toLocaleDateString()}
                          </span>
                          {offer.offerer.rating && (
                            <div className="flex items-center text-sm text-secondary-600">
                              <span className="font-medium">{offer.offerer.rating}</span>
                              <span className="ml-1">⭐</span>
                            </div>
                          )}
                        </div>
                        {offer.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button className="btn-primary text-sm px-4 py-2">
                              Accept
                            </button>
                            <button className="btn-secondary text-sm px-4 py-2">
                              Reject
                            </button>
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                              Counter Offer
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

      {/* Active Trades */}
      {activeTab === 'trades' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">
              Active Trades
            </h2>
            <span className="text-sm text-secondary-600">
              {activeTrades.length} active
            </span>
          </div>

          {activeTrades.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                No active trades
              </h3>
              <p className="text-secondary-600">
                When you accept a trade offer, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTrades.map(trade => (
                <div key={trade.id} className="card">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={trade.item1.photo}
                        alt={trade.item1.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-secondary-900">
                        {trade.item1.title}
                      </h3>
                      <p className="text-secondary-600">
                        Trading with {trade.user.name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ArrowPathIcon className="w-6 h-6 text-secondary-400" />
                    </div>
                    <div className="flex-shrink-0">
                      <img
                        src={trade.item2.photo}
                        alt={trade.item2.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-secondary-900">
                        {trade.item2.title}
                      </h3>
                      <p className="text-secondary-600">
                        Your item
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(trade.status)}
                        <span className="text-sm font-medium text-secondary-600">
                          {getStatusText(trade.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button className="btn-primary text-sm px-4 py-2">
                      Complete Trade
                    </button>
                    <button className="btn-secondary text-sm px-4 py-2">
                      Cancel Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Trades;
