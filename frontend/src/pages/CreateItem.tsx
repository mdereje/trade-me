import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CreateItemForm {
  title: string;
  description: string;
  condition: string;
  categoryId: number;
  zipCode: string;
  city: string;
  state: string;
}

const CreateItem: React.FC = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateItemForm>();

  const categories = [
    { id: 1, name: 'Electronics', icon: '📱' },
    { id: 2, name: 'Furniture', icon: '🪑' },
    { id: 3, name: 'Books', icon: '📚' },
    { id: 4, name: 'Clothing', icon: '👕' },
    { id: 5, name: 'Tools', icon: '🔧' },
    { id: 6, name: 'Sports', icon: '⚽' },
  ];

  const conditions = [
    'New',
    'Like New',
    'Good',
    'Fair',
    'Poor'
  ];

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 5)); // Max 5 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateItemForm) => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to create item
      console.log('Creating item:', data, photos);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          List a New Item
        </h1>
        <p className="text-secondary-600">
          Share your item with the community and start trading!
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Photos */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            Photos (Required)
          </h2>
          <p className="text-secondary-600 mb-4">
            Upload at least 1 photo. You can add up to 5 photos.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {photos.length < 5 && (
              <label className="border-2 border-dashed border-secondary-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                <PhotoIcon className="w-8 h-8 text-secondary-400 mb-2" />
                <span className="text-sm text-secondary-600">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  multiple
                />
              </label>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            Item Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="input-field"
                placeholder="What are you trading?"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="input-field"
                placeholder="Describe your item in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Category *
                </label>
                <select
                  {...register('categoryId', { required: 'Category is required' })}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Condition *
                </label>
                <select
                  {...register('condition', { required: 'Condition is required' })}
                  className="input-field"
                >
                  <option value="">Select condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            Location
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                ZIP Code *
              </label>
              <input
                {...register('zipCode', { required: 'ZIP code is required' })}
                type="text"
                className="input-field"
                placeholder="12345"
              />
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                City *
              </label>
              <input
                {...register('city', { required: 'City is required' })}
                type="text"
                className="input-field"
                placeholder="Your city"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                State *
              </label>
              <input
                {...register('state', { required: 'State is required' })}
                type="text"
                className="input-field"
                placeholder="Your state"
              />
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || photos.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'List Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateItem;
