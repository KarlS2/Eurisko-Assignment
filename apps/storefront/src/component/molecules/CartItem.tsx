import { Link } from 'react-router-dom';
import { CartItem as CartItemType } from '../../lib/store';
import { formatCurrency } from '../../lib/format';
import Button from '../atoms/Button';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity } = item;
  const subtotal = product.price * quantity;
  
  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      <Link to={`/p/${product.id}`} className="flex-shrink-0">
        <img
          src={product.image}
          alt={product.title}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link
          to={`/p/${product.id}`}
          className="text-base font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
        >
          {product.title}
        </Link>
        
        <p className="text-sm text-gray-500 mt-1">
          {formatCurrency(product.price)} each
        </p>
        
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
              className="px-3 py-1 hover:bg-gray-100 transition-colors"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="px-4 py-1 border-x border-gray-300 min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
              className="px-3 py-1 hover:bg-gray-100 transition-colors"
              aria-label="Increase quantity"
              disabled={quantity >= product.stockQty}
            >
              +
            </button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(product.id)}
            aria-label={`Remove ${product.title} from cart`}
          >
            Remove
          </Button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">
          {formatCurrency(subtotal)}
        </p>
      </div>
    </div>
  );
}