import React from 'react';
import { useParams } from 'react-router-dom';
import { PhotoIcon, MapPinIcon, UserIcon, StarIcon } from '@heroicons/react/24/outline';

const ItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Mock data - replace with actual API call
  const item = {
    id: parseInt(id || '1'),
    title: 'Vintage Wooden Chair',
    description: 'Beautiful vintage wooden chair in excellent condition. Perfect for dining room or office.',
    condition: 'Good',
    category: { name: 'Furniture', icon: '🪑' },
    owner: {
      id: 1,
      fullName: 'John Doe',
      city: 'San Francisco',
      state: 'CA',
      averageRating: 4.5,
      reviewsCount: 12
    },
    photos: [
      { id: 1, photoUrl: '/api/placeholder/400/300', isPrimary: true },
      { id: 2, photoUrl: '/api/placeholder/400/300', isPrimary: false },
    ],
    zipCode: '94102',
    city: 'San Francisco',
    state: 'CA',
    createdAt: '2024-01-15T10:30:00Z'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-w-16 aspect-h-9 mb-4 bg-secondary-100 rounded-lg overflow-hidden">
            {item.photos && item.photos.length > 0 ? (
              <img
                src={item.photos[0].photoUrl}
                alt={item.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-secondary-200 flex items-center justify-center">
                <PhotoIcon className="w-16 h-16 text-secondary-400" />
              </div>
            )}
          </div>
          
          {item.photos && item.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.photos.slice(1).map((photo, index) => (
                <div key={photo.id} className="aspect-w-1 aspect-h-1 bg-secondary-100 rounded overflow-hidden">
                  <img
                    src={photo.photoUrl}
                    alt={`${item.title} ${index + 2}`}
                    className="w-full h-20 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{item.category.icon}</span>
              <span className="text-sm text-secondary-600">{item.category.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              {item.title}
            </h1>
            <div className="flex items-center text-secondary-600 mb-4">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>{item.city}, {item.state} {item.zipCode}</span>
            </div>
            <div className="flex items-center">
              <span className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                {item.condition} Condition
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-secondary-900 mb-2">Description</h2>
            <p className="text-secondary-700 leading-relaxed">
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
                <h4 className="font-medium text-secondary-900">{item.owner.fullName}</h4>
                <div className="flex items-center text-sm text-secondary-600">
                  <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{item.owner.averageRating}</span>
                  <span className="ml-1">({item.owner.reviewsCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="btn-primary w-full">
              Make Trade Offer
            </button>
            <button className="btn-secondary w-full">
              Contact Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
