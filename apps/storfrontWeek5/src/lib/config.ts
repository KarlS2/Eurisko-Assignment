// src/lib/config.ts
// Centralized configuration for API endpoints

/// <reference types="vite/client" />

/**
 * API Configuration
 * 
 * In development: Uses VITE_API_URL from .env or defaults to localhost:3000
 * In production: Uses the deployed backend URL
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

export const config = {
  // Base API URL
  apiUrl: API_BASE_URL,
  
  // API Endpoints
  endpoints: {
    // Customers
    customers: `${API_BASE_URL}/api/customers`,
    
    // Products
    products: `${API_BASE_URL}/api/products`,
    
    // Orders
    orders: `${API_BASE_URL}/api/orders`,
    
    // Analytics
    analytics: `${API_BASE_URL}/api/analytics`,
    
    // Dashboard
    dashboard: `${API_BASE_URL}/api/dashboard`,
    
    // Assistant
    assistant: `${API_BASE_URL}/api/assistant`,
    
    // Health check
    health: `${API_BASE_URL}/health`,
  },
  
  // Request timeouts (milliseconds) timeout might be larger than standards timeout because the model might be slower through ngrok
  timeouts: {
    default: 50000,      // 50 seconds
    assistant: 60000,    // 60 seconds (assistant might be slower)
    sse: 0,              // No timeout for SSE connections
  },
  
  // SSE endpoints
  sse: {
    orderStatus: (orderId: string) => `${API_BASE_URL}/api/orders/${orderId}/stream`,
  },
} as const;

/**
 * Helper to build query strings
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Helper for fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = config.timeouts.default
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Helper to handle API errors
 */
export function handleApiError(error: any, context: string): Error {
  console.error(`[API Error] ${context}:`, error);
  
  if (error.name === 'AbortError') {
    return new Error(`Request timeout: ${context}`);
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new Error(`Network error: Cannot reach API server. ${context}`);
  }
  
  return error instanceof Error ? error : new Error(`Unknown error: ${context}`);
}