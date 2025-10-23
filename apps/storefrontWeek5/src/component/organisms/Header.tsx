// src/component/organisms/Header.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useUserStore } from '../../lib/store';
import Badge from '../atoms/Badge';

interface HeaderProps {
  onOpenSupport: () => void;
  onOpenLogin: () => void;
}

export default function Header({ onOpenSupport, onOpenLogin }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, isAuthenticated, isAdmin } = useUserStore();
  
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">
              Karl Storefront
            </span>
            <span className="text-xl font-bold text-gray-900 sm:hidden">
              Karl Storefont
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Catalog
            </Link>
            
            {isAuthenticated() && (
              <Link
                to="/orders"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Orders
              </Link>
            )}
            
            {isAdmin() && (
              <Link
                to="/admin"
                className="relative text-gray-700 hover:text-red-600 font-medium transition-colors"
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
            >
              Support
            </button>
            
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isAuthenticated() ? (
                <span className="flex items-center gap-1">
                  {user?.name?.split(' ')[0]}
                  {isAdmin() && <span className="text-red-600 text-xs">★</span>}
                </span>
              ) : (
                <span>Login</span>
              )}
            </button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-primary-600"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Catalog
              </Link>
              
              {isAuthenticated() && (
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders
                </Link>
              )}
              
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-red-600 font-medium transition-colors flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                  <Badge variant="danger" size="sm">
                    Admin
                  </Badge>
                </Link>
              )}
              
              <Link
                to="/cart"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cart
                {itemCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {itemCount}
                  </Badge>
                )}
              </Link>
              
              <button
                onClick={() => {
                  onOpenSupport();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Support
              </button>
              
              <button
                onClick={() => {
                  onOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {isAuthenticated() ? (
                  <span className="flex items-center gap-1">
                    {user?.name}
                    {isAdmin() && <Badge variant="danger" size="sm">Admin</Badge>}
                  </span>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

