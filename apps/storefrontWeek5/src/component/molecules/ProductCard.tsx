// src/component/molecules/ProductCard.tsx
// Updated for backend compatibility

import { Link } from 'react-router-dom';
import type { Product } from '../../lib/store';
import { formatCurrency } from '../../lib/format';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Handle both backend and frontend field names
  const productId = product._id || product.id;
  const productName = product.name || product.title;
  const productImage = product.imageUrl || product.image;
  const productStock = product.stock ?? product.stockQty;
  
  const isLowStock = productStock < 10;
  const isOutOfStock = productStock === 0;
  
  return (
    <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/p/${productId}`} className="block">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={productImage}
            alt={productName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/p/${productId}`}
            className="flex-1 text-base font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
          >
            {productName}
          </Link>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {product.category && (
            <Badge variant="info" size="sm">
              {product.category}
            </Badge>
          )}
          {product.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(product.price)}
          </span>
          
          {isLowStock && !isOutOfStock && (
            <Badge variant="warning" size="sm">
              Low stock
            </Badge>
          )}
          
          {isOutOfStock && (
            <Badge variant="danger" size="sm">
              Out of stock
            </Badge>
          )}
        </div>
        
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          aria-label={`Add ${productName} to cart`}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}