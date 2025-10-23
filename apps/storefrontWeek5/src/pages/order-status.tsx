// src/pages/order-status.tsx
// Responsive order status page with SSE live tracking

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, type BackendOrder } from '../lib/api';
import { connectToOrderStream, type SSEConnection } from '../lib/sse-client';
import { formatCurrency, formatDate } from '../lib/format';
import Button from '../component/atoms/Button';
import Badge from '../component/atoms/Badge';
import Spinner from '../component/atoms/Spinner';

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  
  // Load initial order
  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);
  
  // Connect to SSE stream
  useEffect(() => {
    if (!order || !id) return;
    
    setIsStreaming(true);
    setStreamError('');
    
    const connection = connectToOrderStream(id, {
      onEvent: (event) => {
        console.log('[Order Page] SSE event:', event);
        
        // Update order status in state
        setOrder((prevOrder) => {
          if (!prevOrder) return prevOrder;
          return {
            ...prevOrder,
            status: event.status,
            carrier: event.carrier,
            trackingNumber: event.trackingNumber,
            estimatedDelivery: event.estimatedDelivery,
            updatedAt: event.updatedAt,
          };
        });
      },
      
      onError: (error) => {
        console.error('[Order Page] SSE error:', error);
        setStreamError(error.message);
        setIsStreaming(false);
      },
      
      onClose: () => {
        console.log('[Order Page] SSE connection closed');
        setIsStreaming(false);
      },
      
      reconnect: true,
      maxReconnectAttempts: 3,
    });
    
    // Cleanup on unmount
    return () => {
      console.log('[Order Page] Cleaning up SSE connection');
      connection.close();
    };
  }, [order?._id, id]);
  
  async function loadOrder(orderId: string) {
    setIsLoading(true);
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
        <Spinner size="lg" />
        <p className="text-sm sm:text-base text-gray-600">Loading order details...</p>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="text-center py-8 px-4 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Order not found</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          The order ID you're looking for doesn't exist or may have been entered incorrectly.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            Return to Catalog
          </Button>
        </Link>
      </div>
    );
  }
  
  const statusVariant = {
    PENDING: 'info',
    PROCESSING: 'warning',
    SHIPPED: 'warning',
    DELIVERED: 'success',
  } as const;
  
  const statusSteps = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];
  
  const currentStepIndex = statusSteps.findIndex((step) => step.value === order.status);
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Order Confirmation</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {isStreaming ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live tracking active
            </span>
          ) : (
            'Your order details'
          )}
        </p>
      </div>
      
      {/* Stream Error Alert */}
      {streamError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs sm:text-sm text-yellow-800">
            <strong>Connection issue:</strong> {streamError}. Showing last known status.
          </p>
        </div>
      )}
      
      {/* Main Order Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Order Number and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-medium text-gray-500">Order Number</h2>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 font-mono break-all">
              {order._id}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Badge variant={statusVariant[order.status]} size="md">
              {order.status}
            </Badge>
          </div>
        </div>
        
        {/* Order Date and Total */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Order Date</h3>
            <p className="text-sm sm:text-base text-gray-900">
              {formatDate(order.createdAt)}
            </p>
          </div>
          
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Order Total</h3>
            <p className="text-sm sm:text-base text-gray-900 font-bold">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>
        
        {/* Progress Timeline */}
        <div className="py-6">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{
                  width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            </div>
            
            {/* Steps - Desktop and Tablet */}
            <div className="hidden sm:flex relative justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.value} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary-600 text-white scale-100'
                          : 'bg-gray-200 text-gray-500 scale-90'
                      } ${isCurrent ? 'ring-4 ring-primary-100 scale-110' : ''}`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium transition-colors text-center ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Steps - Mobile (Vertical) */}
            <div className="flex sm:hidden flex-col gap-6 relative pl-6">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.value} className="flex items-center gap-4 relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 flex-shrink-0 ${
                        isCompleted
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-base font-medium transition-colors ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {/* Vertical connector line */}
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 w-0.5 h-6 ${
                          index < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start gap-4 text-xs sm:text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium truncate">{item.name}</p>
                  <p className="text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="text-gray-900 font-medium whitespace-nowrap">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Tracking Information */}
        {order.carrier && (
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Carrier</h3>
              <p className="text-sm sm:text-base text-gray-900">{order.carrier}</p>
            </div>
            
            {order.trackingNumber && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Tracking Number
                </h3>
                <p className="text-sm sm:text-base font-mono text-gray-900 break-all">
                  {order.trackingNumber}
                </p>
              </div>
            )}
            
            {order.estimatedDelivery && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                  Estimated Delivery
                </h3>
                <p className="text-sm sm:text-base text-gray-900">
                  {formatDate(order.estimatedDelivery)}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Last Updated */}
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          Last updated: {formatDate(order.updatedAt)}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-center">
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="primary" size="lg" fullWidth>
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
