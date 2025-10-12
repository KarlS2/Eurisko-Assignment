import { Link } from 'react-router-dom';
import { useCartStore } from '../../lib/store';
import Badge from '../atoms/Badge';

interface HeaderProps {
  onOpenSupport: () => void;
}

export default function Header({ onOpenSupport }: HeaderProps) {
  const itemCount = useCartStore((state) => state.getItemCount());
  
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
              Ask Support
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}