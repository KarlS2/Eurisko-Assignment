// routes/orders.js
const express = require('express');
const router = express.Router();
const { Order, Customer, Product } = require('../db');

// GET orders by customer ID
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    
    if (!customerId) {
      return res.status(400).json({ error: 'customerId parameter is required' });
    }

    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new order
router.post('/', async (req, res) => {
  try {
    const { customerId, items } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate total and validate items
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      // Validate item structure
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ 
          error: 'Each item must have productId and quantity' 
        });
      }

      // Validate quantity is positive integer
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Quantity must be a positive integer' 
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          error: `Product ${item.productId} not found` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order with estimated delivery (7-10 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 4) + 7);

    const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
    const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];

    const order = new Order({
      customerId,
      items: orderItems,
      total,
      status: 'PENDING',
      carrier: randomCarrier,
      trackingNumber: `TRK${Date.now()}${Math.floor(Math.random() * 10000)}`,
      estimatedDelivery,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;