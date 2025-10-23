// src/lib/api.ts
// Real backend API integration

import { config, buildQueryString, fetchWithTimeout, handleApiError } from './config';
import type { User, Product as StoreProduct } from './store';

// Re-export Product type for convenience
export type { Product } from './store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BackendProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  imageUrl: string;
  stock: number;
  createdAt: string;
}

export interface BackendOrder {
  _id: string;
  customerId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusEvent {
  orderId: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  updatedAt: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  products?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform backend product to frontend format
 */
function transformProduct(backendProduct: BackendProduct): StoreProduct {
  return {
    _id: backendProduct._id,
    id: backendProduct._id, // Compatibility
    name: backendProduct.name,
    title: backendProduct.name, // Compatibility
    price: backendProduct.price,
    image: backendProduct.imageUrl,
    imageUrl: backendProduct.imageUrl,
    tags: backendProduct.tags || [],
    category: backendProduct.category,
    stock: backendProduct.stock,
    stockQty: backendProduct.stock, // Compatibility
    description: backendProduct.description || '',
  };
}

// ============================================================================
// CUSTOMER API
// ============================================================================

/**
 * Get customer by email (for user identification)
 */
export async function getCustomerByEmail(email: string): Promise<User> {
  try {
    const url = `${config.endpoints.customers}${buildQueryString({ email })}`;
    const response = await fetchWithTimeout(url);

    if (response.status === 404) {
      throw new Error('Customer not found. Please check your email address.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch customer');
    }

    const customer = await response.json();
    return customer as User;
  } catch (error) {
    throw handleApiError(error, 'Get customer by email');
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<User> {
  try {
    const url = `${config.endpoints.customers}/${customerId}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error('Failed to fetch customer');
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error, 'Get customer');
  }
}

// ============================================================================
// PRODUCT API
// ============================================================================

/**
 * List products with filtering and pagination
 */
export async function listProducts(params?: {
  search?: string;
  tag?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<StoreProduct[]> {
  try {
    const url = `${config.endpoints.products}${buildQueryString(params || {})}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data: PaginatedResponse<BackendProduct> = await response.json();
    const products = data.products || [];

    return products.map(transformProduct);
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

/**
 * Get single product by ID
 */
export async function getProduct(id: string): Promise<StoreProduct | null> {
  try {
    const url = `${config.endpoints.products}/${id}`;
    const response = await fetchWithTimeout(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    const backendProduct: BackendProduct = await response.json();
    return transformProduct(backendProduct);
  } catch (error) {
    console.error('Error loading product:', error);
    return null;
  }
}

/**
 * Search products
 */
export async function searchProducts(query: string): Promise<StoreProduct[]> {
  return listProducts({ search: query, limit: 50 });
}

/**
 * Get related products (by tags)
 */
export async function getRelatedProducts(
  productId: string,
  limit = 3
): Promise<StoreProduct[]> {
  try {
    const product = await getProduct(productId);
    if (!product) return [];

    // Search by first tag
    const tag = product.tags[0];
    if (!tag) return [];

    const products = await listProducts({ tag, limit: limit + 1 });
    
    // Filter out current product
    return products
      .filter((p) => p._id !== productId && p.id !== productId)
      .slice(0, limit);
  } catch (error) {
    console.error('Error loading related products:', error);
    return [];
  }
}

/**
 * Sort products (client-side)
 */
export function sortProducts(
  products: StoreProduct[],
  sortBy: 'price-asc' | 'price-desc'
): StoreProduct[] {
  return [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    return b.price - a.price;
  });
}

/**
 * Filter products by tag (client-side)
 */
export function filterProductsByTag(products: StoreProduct[], tag: string): StoreProduct[] {
  if (!tag) return products;
  return products.filter((p) => p.tags.includes(tag));
}

// ============================================================================
// ORDER API
// ============================================================================

/**
 * Create new order
 */
export async function placeOrder(
  customerId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<{ orderId: string; order: BackendOrder }> {
  try {
    const url = config.endpoints.orders;
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, items }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to place order');
    }

    const order: BackendOrder = await response.json();
    return {
      orderId: order._id,
      order,
    };
  } catch (error) {
    throw handleApiError(error, 'Place order');
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<BackendOrder | null> {
  try {
    const url = `${config.endpoints.orders}/${orderId}`;
    const response = await fetchWithTimeout(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading order:', error);
    return null;
  }
}

/**
 * Get customer orders
 */
export async function getCustomerOrders(customerId: string): Promise<BackendOrder[]> {
  try {
    const url = `${config.endpoints.orders}${buildQueryString({ customerId })}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading customer orders:', error);
    return [];
  }
}

// ============================================================================
// ASSISTANT API
// ============================================================================

export interface AssistantResponse {
  success: boolean;
  text: string;
  intent?: string;
  confidence?: string;
  citations?: string[];
  invalidCitations?: string[];
  functionsCalled?: string[];
  products?: any[];
  orderData?: any;
  processingTime?: number;
}

/**
 * Send query to assistant
 */
export async function chatWithAssistant(query: string): Promise<AssistantResponse> {
  try {
    const url = `${config.endpoints.assistant}/chat`;
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      },
      50000 // 50 seconds timeout for assistant
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Assistant request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Assistant error:', error);
    return {
      success: false,
      text: 'I apologize, but I encountered an error processing your request. Please try again or contact support@shoplite.com.',
      intent: 'error',
    };
  }
}

// ============================================================================
// ANALYTICS API
// ============================================================================

export interface DailyRevenue {
  date: string;
  revenue: number;
  orderCount: number;
}

/**
 * Get daily revenue analytics
 */
export async function getDailyRevenue(
  from: string,
  to: string
): Promise<DailyRevenue[]> {
  try {
    const url = `${config.endpoints.analytics}/daily-revenue${buildQueryString({ from, to })}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading analytics:', error);
    return [];
  }
}

// ============================================================================
// LEGACY COMPATIBILITY (deprecated, use new functions above)
// ============================================================================

/**
 * @deprecated Use getOrder() instead
 */
export function getOrderStatus(_orderId: string): any {
  console.warn('getOrderStatus() is deprecated. Use getOrder() instead.');
  return null;
}