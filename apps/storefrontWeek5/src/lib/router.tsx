// src/lib/router.tsx
// Updated with orders page route

import { createBrowserRouter } from 'react-router-dom';
import App from '../app';
import CatalogPage from '../pages/catalog';
import ProductPage from '../pages/product';
import CartPage from '../pages/cart';
import CheckoutPage from '../pages/checkout';
import OrderStatusPage from '../pages/order-status';
import OrdersPage from '../pages/orders';
import AdminDashboard from '../pages/AdminDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <CatalogPage />,
      },
      {
        path: 'p/:id',
        element: <ProductPage />,
      },
      {
        path: 'cart',
        element: <CartPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'order/:id',
        element: <OrderStatusPage />,
      },
      {
        path: 'orders', // NEW: Orders history page
        element: <OrdersPage />,
      },
      {
        path: 'admin',
        element: <AdminDashboard />,
      },
    ],
  },
]);