// src/pages/checkout.tsx
// Updated with real order creation

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore, useUserStore } from '../lib/store';
import { placeOrder } from '../lib/api';
import { formatCurrency } from '../lib/format';
import Button from '../component/atoms/Button';
import Spinner from '../component/atoms/Spinner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user, isAuthenticated } = useUserStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;
  
  if (!isAuthenticated() || !user) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Please login to checkout
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          You need to identify yourself before placing an order.
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          Click the account icon in the header to login.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">Add some products before checking out.</p>
        <Link to="/">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');
    
    try {
      const orderItems = items.map((item) => ({
        productId: item.product._id || item.product.id,
        quantity: item.quantity,
      }));
      
      const { orderId } = await placeOrder(user._id, orderItems);
      
      clearCart();
      navigate(`/order/${orderId}`);
    } catch (err: any) {
      console.error('Order failed:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6 px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
      
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Customer Information</h2>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {user.name}
              </p>
              <p className="text-gray-700 break-all">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              {user.phone && (
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {user.phone}
                </p>
              )}
            </div>
          </div>
          
          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shipping Address</h2>
            {user.address ? (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                <p className="text-gray-700">{user.address.street}</p>
                <p className="text-gray-700">
                  {user.address.city}, {user.address.state} {user.address.zipCode}
                </p>
                <p className="text-gray-700">{user.address.country}</p>
              </div>
            ) : (
              <p className="text-gray-600 text-xs sm:text-sm">
                No address on file. Order will use default shipping.
              </p>
            )}
          </div>
          
          {/* Payment Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment Information</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Demo Mode:</strong> This is a demonstration checkout. No real payment will be processed.
              </p>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" />
                Processing Order...
              </span>
            ) : (
              'Place Order'
            )}
          </Button>
        </form>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-20">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700 pr-2 line-clamp-1">
                    {item.product.name || item.product.title} × {item.quantity}
                  </span>
                  <span className="text-gray-900 font-medium flex-shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    formatCurrency(shipping)
                  )}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
