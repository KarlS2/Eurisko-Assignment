// src/lib/store.ts
// Updated Zustand store with user authentication and role state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Updated Product interface to match backend
export interface Product {
  _id?: string;        // MongoDB ID (from backend)
  id: string;          // Keep for compatibility
  name?: string;       // Backend uses 'name'
  title: string;       // Frontend uses 'title'
  price: number;
  image?: string;
  imageUrl?: string;   // Backend uses 'imageUrl'
  tags: string[];
  category?: string;
  stock?: number;      // Backend uses 'stock'
  stockQty: number;    // Frontend uses 'stockQty'
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// User/Customer interface matching backend (with role)
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';  // NEW: Role field
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt?: string;
}

// Cart Store
interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

// User Store (with role helpers)
interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;  // NEW: Check if user is admin
}

// Cart Store (existing logic + updates)
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          // Handle both 'stock' (backend) and 'stockQty' (frontend)
          const maxQty = product.stock ?? product.stockQty ?? Infinity;
          
          const existingItem = state.items.find(
            (item) => (item.product._id || item.product.id) === (product._id || product.id)
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                (item.product._id || item.product.id) === (product._id || product.id)
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + quantity, maxQty),
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity: Math.min(quantity, maxQty),
              },
            ],
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(
            (item) => (item.product._id || item.product.id) !== productId
          ),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => (item.product._id || item.product.id) !== productId
              ),
            };
          }

          return {
            items: state.items.map((item) =>
              (item.product._id || item.product.id) === productId
                ? { ...item, quantity }
                : item
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'shoplite-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// User Store (with role support)
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user: User | null) => {
        set({ user });
      },

      clearUser: () => {
        set({ user: null });
      },

      isAuthenticated: () => {
        return get().user !== null;
      },

      isAdmin: () => {
        const user = get().user;
        return user !== null && user.role === 'admin';
      },
    }),
    {
      name: 'shoplite-user',
      partialize: (state) => ({ user: state.user }),
    }
  )
);