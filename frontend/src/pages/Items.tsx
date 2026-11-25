import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { itemsApi } from '../services/api';

const Items: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'category'>('newest');

  // Applied filter state so users can type smoothly and press Enter or Apply
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedLocation, setAppliedLocation] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['item-categories'],
    queryFn: () => itemsApi.getCategories(),
  });

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['browse-items', appliedSearch, selectedCategory, appliedLocation, sortBy],
    queryFn: () =>
      itemsApi.browseItems({
        q: appliedSearch || undefined,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        location: appliedLocation || undefined,
        sort: sortBy,
        limit: 48,
      }),
  });

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setAppliedLocation(locationInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setLocationInput('');
    setAppliedSearch('');
    setAppliedLocation('');
    setSelectedCategory('');
    setSortBy('newest');
  };

  const hasActiveFilters = Boolean(appliedSearch || appliedLocation || selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Browse Items</h1>
            <p className="text-secondary-600 mt-1">
              Explore active local listings for free — no account needed to browse.
            </p>
          </div>
          <Link to="/create-item" className="btn-primary text-center">
            + List an Item
          </Link>
        </div>

        {/* Search and Filters */}
        <form
          onSubmit={applyFilters}
          className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="City, state, or ZIP code"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            <button type="submit" className="btn-primary flex items-center justify-center">
              <FunnelIcon className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-secondary-600">
                Showing {items.length} matching {items.length === 1 ? 'item' : 'items'}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Clear filters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Category Chips */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id.toString();
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(isSelected ? '' : category.id.toString())
                  }
                  className={`p-3 rounded-lg border-2 text-left flex items-center space-x-3 transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 bg-white hover:border-secondary-300'
                  }`}
                >
                  <span className="text-2xl">{category.icon || '📦'}</span>
                  <span className="text-sm font-medium text-secondary-900 truncate">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">
            Available Items ({items.length})
          </h2>
          <div className="flex items-center space-x-3">
            <label htmlFor="sort-select" className="text-sm text-secondary-600">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'category')}
              className="input-field w-auto"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {isError ? (
          <div className="card text-center py-10 text-red-700 bg-red-50 border-red-200">
            <p className="font-semibold mb-1">Could not load items</p>
            <p className="text-sm">{(error as Error)?.message || 'Please try again shortly.'}</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="card animate-pulse">
                <div className="w-full h-48 bg-secondary-200 rounded-lg mb-4" />
                <div className="h-5 bg-secondary-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-secondary-100 rounded w-full mb-2" />
                <div className="h-4 bg-secondary-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card text-center py-12">
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No items found</h3>
            <p className="text-secondary-600 mb-4">
              {hasActiveFilters
                ? 'Try clearing or adjusting your search filters.'
                : 'Be the first in your area to list an item for trade!'}
            </p>
            <div className="flex justify-center gap-3">
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              )}
              <Link to="/create-item" className="btn-primary">
                List Your First Item Free
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const primaryPhoto =
                item.photos.find((p) => p.isPrimary) || item.photos[0];
              return (
                <Link
                  key={item.id}
                  to={`/items/${item.id}`}
                  className="card p-4 hover:shadow-lg transition-shadow cursor-pointer group flex flex-col"
                >
                  <div className="mb-4 bg-secondary-100 rounded-lg overflow-hidden">
                    {primaryPhoto ? (
                      <img
                        src={primaryPhoto.photoUrl}
                        alt={item.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-48 bg-secondary-200 flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-secondary-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-secondary-500 mb-1">
                    {item.category?.icon} {item.category?.name}
                  </div>
                  <h3 className="font-semibold text-secondary-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-secondary-600 text-sm mb-3 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-secondary-100">
                    <span className="text-xs text-secondary-500 flex items-center">
                      <MapPinIcon className="w-3.5 h-3.5 mr-1" />
                      {item.city}, {item.state}
                    </span>
                    <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      {item.condition}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;
