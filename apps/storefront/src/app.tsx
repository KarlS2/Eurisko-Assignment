import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './component/organisms/Header';
import SupportPanel from './component/organisms/SupportPanel';

export default function App() {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onOpenSupport={() => setIsSupportOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <SupportPanel
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
      
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