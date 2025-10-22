// src/app.tsx
// Updated with user login modal

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useUserStore } from './lib/store';
import Header from './component/organisms/Header';
import SupportPanel from './component/organisms/SupportPanel';
import UserLogin from './component/organisms/UserLogin';

export default function App() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAuthenticated } = useUserStore();

  // Show login modal on first visit if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      // Small delay to let page load
      const timer = setTimeout(() => {
        setIsLoginOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <SupportPanel
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
      
      {/* Login Modal */}
      {isLoginOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => !isAuthenticated() ? null : setIsLoginOpen(false)}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {isAuthenticated() ? 'Account' : 'Welcome!'}
                </h2>
                {isAuthenticated() && (
                  <button
                    onClick={() => setIsLoginOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-2"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="p-6">
                <UserLogin onClose={() => setIsLoginOpen(false)} />
              </div>
            </div>
          </div>
        </>
      )}
      
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            © 2025 Karl Storefront. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}