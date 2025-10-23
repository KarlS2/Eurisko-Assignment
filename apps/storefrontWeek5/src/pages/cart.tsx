import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../lib/store';
import { formatCurrency } from '../lib/format';
import Button from '../component/atoms/Button';
import CartItem from '../component/molecules/CartItem';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCartStore();
  
  // Calculate subtotal from items
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add some products to get started!</p>
        <Link to="/">
          <Button variant="primary" size="lg">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {items.map((item) => (
              <CartItem
                key={item.product.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-base text-gray-700">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-base text-gray-700">
                <span>Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              
              <div className="flex justify-between text-base text-gray-700">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    formatCurrency(shipping)
                  )}
                </span>
              </div>
              
              {subtotal < 50 && (
                <p className="text-sm text-gray-500">
                  Add {formatCurrency(50 - subtotal)} more for free shipping!
                </p>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
              
              <Link to="/">
                <Button variant="ghost" size="md" fullWidth>
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}