import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  FunnelIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const Items: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Mock data - replace with actual API calls
  const categories = [
    { id: 1, name: 'Electronics', icon: '📱' },
    { id: 2, name: 'Furniture', icon: '🪑' },
    { id: 3, name: 'Books', icon: '📚' },
    { id: 4, name: 'Clothing', icon: '👕' },
    { id: 5, name: 'Tools', icon: '🔧' },
    { id: 6, name: 'Sports', icon: '⚽' },
  ];

  const items: any[] = [
    // Mock items will be populated from API
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">
          Browse Items
        </h1>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="ZIP code or city"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <button className="btn-primary flex items-center justify-center">
              <FunnelIcon className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id.toString())}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedCategory === category.id.toString()
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-secondary-200 hover:border-secondary-300'
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium text-secondary-900">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">
            Available Items
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-secondary-600">Sort by:</span>
            <select className="input-field w-auto">
              <option>Newest</option>
              <option>Oldest</option>
              <option>Distance</option>
              <option>Category</option>
            </select>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              No items found
            </h3>
            <p className="text-secondary-600 mb-4">
              Try adjusting your search criteria or check back later for new items.
            </p>
            <Link to="/create-item" className="btn-primary">
              List Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="aspect-w-16 aspect-h-9 mb-4 bg-secondary-100 rounded-lg overflow-hidden">
                  {item.photos && item.photos.length > 0 ? (
                    <img
                      src={item.photos[0].photoUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-secondary-200 flex items-center justify-center">
                      <PhotoIcon className="w-12 h-12 text-secondary-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-secondary-600 text-sm mb-2 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-500">
                    {item.city}, {item.state}
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    {item.condition}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;
