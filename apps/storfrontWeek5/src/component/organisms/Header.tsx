// src/component/organisms/Header.tsx
// Updated with Orders link for authenticated users

import { Link } from 'react-router-dom';
import { useCartStore, useUserStore } from '../../lib/store';
import Badge from '../atoms/Badge';

interface HeaderProps {
  onOpenSupport: () => void;
  onOpenLogin: () => void;
}

export default function Header({ onOpenSupport, onOpenLogin }: HeaderProps) {
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, isAuthenticated, isAdmin } = useUserStore();
  
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Karl Storefront</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Catalog
            </Link>
            
            {/* Orders link - ONLY visible to authenticated users */}
            {isAuthenticated() && (
              <Link
                to="/orders"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                aria-label="View your orders"
              >
                Orders
              </Link>
            )}
            
            {/* Dashboard link - ONLY visible to admins */}
            {isAdmin() && (
              <Link
                to="/admin"
                className="relative text-gray-700 hover:text-red-600 font-medium transition-colors"
                aria-label="Admin dashboard"
              >
                <span className="flex items-center gap-1">
                  Dashboard
                  <Badge variant="danger" size="sm">
                    Admin
                  </Badge>
                </span>
              </Link>
            )}
            
            <Link
              to="/cart"
              className="relative text-gray-700 hover:text-primary-600 font-medium transition-colors"
              aria-label={`Cart with ${itemCount} items`}
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3">
                  <Badge variant="danger" size="sm">
                    {itemCount}
                  </Badge>
                </span>
              )}
            </Link>
            
            <button
              onClick={onOpenSupport}
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              aria-label="Open support panel"
            >
              Support
            </button>
            
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
              aria-label={isAuthenticated() ? 'View account' : 'Login'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isAuthenticated() ? (
                <span className="hidden sm:inline items-center gap-1">
                  {user?.name?.split(' ')[0]}
                  {isAdmin() && <span className="text-red-600 text-xs">★</span>}
                </span>
              ) : (
                <span className="hidden sm:inline">Login</span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}