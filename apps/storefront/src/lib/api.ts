export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  tags: string[];
  stockQty: number;
  description: string;
}

export interface OrderStatus {
  orderId: string;
  status: 'Placed' | 'Packed' | 'Shipped' | 'Delivered';
  date: string;
  carrier?: string;
  trackingNumber?: string;
  eta?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Mock order database
const mockOrders: Record<string, OrderStatus> = {
  'ORD12345ABC': {
    orderId: 'ORD12345ABC',
    status: 'Shipped',
    date: '2024-10-05',
    carrier: 'FedEx',
    trackingNumber: 'FX123456789',
    eta: '2024-10-10',
  },
  'ORD98765XYZ': {
    orderId: 'ORD98765XYZ',
    status: 'Delivered',
    date: '2024-10-01',
    carrier: 'UPS',
    trackingNumber: 'UP987654321',
    eta: '2024-10-03',
  },
  'ORD55555TEST': {
    orderId: 'ORD55555TEST',
    status: 'Packed',
    date: '2024-10-07',
  },
};

let catalogCache: Product[] | null = null;

export async function listProducts(): Promise<Product[]> {
  if (catalogCache) return catalogCache;
  
  try {
    const response = await fetch('/mock-catalog.json');
    if (!response.ok) throw new Error('Failed to load catalog');
    catalogCache = await response.json();
    return catalogCache || [];
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await listProducts();
  return products.find(p => p.id === id) || null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await listProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => 
    p.title.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
}

export async function getRelatedProducts(productId: string, limit = 3): Promise<Product[]> {
  const product = await getProduct(productId);
  if (!product) return [];
  
  const allProducts = await listProducts();
  const related = allProducts.filter(p => {
    if (p.id === productId) return false;
    return p.tags.some(tag => product.tags.includes(tag));
  });
  
  return related.slice(0, limit);
}

export function getOrderStatus(orderId: string): OrderStatus | null {
  return mockOrders[orderId] || null;
}

export async function placeOrder(cart: CartItem[]): Promise<{ orderId: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate random order ID
  const orderId = 'ORD' + Math.random().toString(36).substring(2, 12).toUpperCase();
  
  // Add to mock orders
  mockOrders[orderId] = {
    orderId,
    status: 'Placed',
    date: new Date().toISOString().split('T')[0],
  };
  
  return { orderId };
}

export function sortProducts(products: Product[], sortBy: 'price-asc' | 'price-desc'): Product[] {
  return [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    return b.price - a.price;
  });
}

export function filterProductsByTag(products: Product[], tag: string): Product[] {
  if (!tag) return products;
  return products.filter(p => p.tags.includes(tag));
}