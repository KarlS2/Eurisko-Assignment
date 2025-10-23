// src/components/organisms/UserLogin.tsx
// Simple user identification via email lookup (no authentication) - with role display

import { useState, FormEvent } from 'react';
import { useUserStore } from '../../lib/store';
import { getCustomerByEmail } from '../../lib/api';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Spinner from '../atoms/Spinner';
import Badge from '../atoms/Badge';

interface UserLoginProps {
  onClose?: () => void;
}

export default function UserLogin({ onClose }: UserLoginProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUser, isAdmin } = useUserStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const customer = await getCustomerByEmail(email);
      setUser(customer);
      setEmail('');
      onClose?.();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to find customer. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setError('');
  };

  // If user is already logged in
  if (user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">Welcome back!</h3>
            <Badge 
              variant={isAdmin() ? 'danger' : 'info'} 
              size="md"
            >
              {isAdmin() ? '👑 Admin' : '👤 User'}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Name:</span> {user.name}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            {user.phone && (
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span> {user.phone}
              </p>
            )}
            <p className="text-gray-700">
              <span className="font-medium">Role:</span>{' '}
              <span className={isAdmin() ? 'text-red-600 font-bold' : 'text-blue-600'}>
                {user.role}
              </span>
            </p>
          </div>

          {isAdmin() && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>Admin privileges active.</strong> You have access to the admin dashboard and all system features.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleLogout}
          variant="secondary"
          size="md"
          fullWidth
        >
          Switch Account
        </Button>
      </div>
    );
  }

  // Login form
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Identify Yourself
        </h3>
        <p className="text-sm text-gray-600">
          Enter your email to access your account and place orders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="demo@example.com"
          fullWidth
          disabled={isLoading}
          error={error}
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              Looking up...
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </form>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        <p className="font-medium mb-1">Demo accounts:</p>
        <ul className="space-y-1">
          <li className="text-red-600 font-bold"> gandalf@shoplite.com (Admin)</li>
          <li className="text-red-600 font-bold"> darth.vader@shoplite.com (Admin)</li>
          <li className="text-red-600 font-bold"> karl.sassine@shoplite.com (Admin)</li>
          <li>• demo@example.com (User - has orders)</li>
          <li>• james.rodriguez@email.com (User)</li>
          <li>• emily.chen@techmail.com (User)</li>
        </ul>
      </div>
    </div>
  );
}