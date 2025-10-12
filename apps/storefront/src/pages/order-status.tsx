import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderStatus, OrderStatus } from '../lib/api';
import { formatDate } from '../lib/format';
import Button from '../component/atoms/Button';
import Badge from '../component/atoms/Badge';

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  
  useEffect(() => {
    if (id) {
      const status = getOrderStatus(id);
      setOrder(status);
    }
  }, [id]);
  
  if (!order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order not found</h1>
        <p className="text-gray-600 mb-6">
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
    Placed: 'info',
    Packed: 'warning',
    Shipped: 'warning',
    Delivered: 'success',
  } as const;
  
  const statusSteps = [
    { label: 'Placed', value: 'Placed' },
    { label: 'Packed', value: 'Packed' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
  ];
  
  const currentStepIndex = statusSteps.findIndex(step => step.value === order.status);
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmation</h1>
        <p className="text-gray-600">
          Thank you for your order! Here's your order status.
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Order Number</h2>
            <p className="text-2xl font-bold text-gray-900 mt-1">{order.orderId}</p>
          </div>
          <Badge variant={statusVariant[order.status]} size="md">
            {order.status}
          </Badge>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Order Date</h3>
          <p className="text-base text-gray-900">{formatDate(order.date)}</p>
        </div>
        
        {/* Progress Steps */}
        <div className="py-6">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.value} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                        isCompleted
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Tracking Information */}
        {order.carrier && (
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Carrier</h3>
              <p className="text-base text-gray-900">{order.carrier}</p>
            </div>
            
            {order.trackingNumber && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tracking Number</h3>
                <p className="text-base font-mono text-gray-900">{order.trackingNumber}</p>
              </div>
            )}
            
            {order.eta && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h3>
                <p className="text-base text-gray-900">{formatDate(order.eta)}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        <Link to="/">
          <Button variant="primary" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}