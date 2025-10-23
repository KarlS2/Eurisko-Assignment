// src/pages/orders.tsx
// Responsive order history page for authenticated users

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../lib/store';
import { getCustomerOrders, type BackendOrder } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import Button from '../component/atoms/Button';
import Badge from '../component/atoms/Badge';
import Spinner from '../component/atoms/Spinner';

export default function OrdersPage() {
  const { user, isAuthenticated } = useUserStore();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?._id) {
      loadOrders();
    }
  }, [user?._id]);

  async function loadOrders() {
    if (!user?._id) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await getCustomerOrders(user._id);
      // Sort by date (newest first)
      const sortedOrders = data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedOrders);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="text-center py-8 px-4 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Please Log In</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          You need to be logged in to view your orders.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            Go to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
        <Spinner size="lg" />
        <p className="text-sm sm:text-base text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Error Loading Orders</h1>
        <p className="text-sm sm:text-base text-red-600 mb-6">{error}</p>
        <Button variant="primary" size="lg" onClick={loadOrders}>
          Try Again
        </Button>
      </div>
    );
  }

  const statusVariant = {
    PENDING: 'info',
    PROCESSING: 'warning',
    SHIPPED: 'warning',
    DELIVERED: 'success',
  } as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track and manage your order history <br />
           An order is never too early, nor too late, it arrives precisely when it means to.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
          <div className="mb-4">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
            Start shopping to see your orders here.
          </p>
          <Link to="/">
            <Button variant="primary" size="lg">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-4 mb-4">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <Badge variant={statusVariant[order.status]} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Order Total */}
                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-1">
                    <p className="text-xs sm:text-sm text-gray-600">Order Total</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-4 text-xs sm:text-sm">
                      <span className="text-gray-700 truncate flex-1">
                        {item.name} {item.quantity > 1 && `× ${item.quantity}`}
                      </span>
                      <span className="text-gray-900 font-medium whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      + {order.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>

              {/* Carrier Information */}
              {order.carrier && (
                <div className="text-xs sm:text-sm text-gray-600 mb-4 space-y-1 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span>
                      <span className="font-medium">Carrier:</span> {order.carrier}
                    </span>
                    {order.estimatedDelivery && (
                      <span>
                        <span className="font-medium">ETA:</span>{' '}
                        {formatDate(order.estimatedDelivery)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link to={`/order/${order._id}`}>
                <Button variant="secondary" size="md" fullWidth>
                  {order.status === 'DELIVERED' ? 'View Details' : 'Track Order'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


