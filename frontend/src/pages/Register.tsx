import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface RegisterForm {
  email: string;
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError('');
      await registerUser(data);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 card">
        <div>
          <h2 className="text-center text-3xl font-bold text-secondary-900">
            Create your free account
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
              Email address *
            </label>
            <input
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="input-field mt-1"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-secondary-700">
              Username *
            </label>
            <input
              id="username"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers, and underscores',
                },
              })}
              type="text"
              className="input-field mt-1"
              placeholder="choose_a_handle"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-secondary-700">
              Full Name *
            </label>
            <input
              id="fullName"
              {...register('fullName', {
                required: 'Full name is required',
                minLength: { value: 2, message: 'Full name must be at least 2 characters' },
              })}
              type="text"
              className="input-field mt-1"
              placeholder="Alex Rivera"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
              Password *
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Create a password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-secondary-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
              Confirm Password *
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-secondary-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-secondary-700">
                City
              </label>
              <input
                id="city"
                {...register('city')}
                type="text"
                className="input-field mt-1"
                placeholder="Austin"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-secondary-700">
                State
              </label>
              <input
                id="state"
                {...register('state')}
                type="text"
                className="input-field mt-1"
                placeholder="TX"
              />
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-secondary-700">
                ZIP
              </label>
              <input
                id="zipCode"
                {...register('zipCode')}
                type="text"
                className="input-field mt-1"
                placeholder="78701"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create free account'}
          </button>

          <p className="text-center text-xs text-secondary-500">
            By signing up you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
