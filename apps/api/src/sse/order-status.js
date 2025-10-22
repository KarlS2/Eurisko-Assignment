// sse/order-status.js
const express = require('express');
const router = express.Router();
const { Order } = require('../db');
const { incrementSSEConnections, decrementSSEConnections } = require('../routes/dashboard');

// SSE endpoint with auto-status progression
router.get('/:id/stream', async (req, res) => {
  const orderId = req.params.id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  incrementSSEConnections();

  // Helper to send SSE event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Get initial order
    let order = await Order.findById(orderId);
    
    if (!order) {
      sendEvent({ error: 'Order not found' });
      res.end();
      decrementSSEConnections();
      return;
    }

    // Send initial status
    sendEvent({
      orderId: order._id,
      status: order.status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      updatedAt: order.updatedAt
    });

    // Auto-progression logic
    const statusFlow = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    let currentStatusIndex = statusFlow.indexOf(order.status);

    const progressOrder = async () => {
      // If already delivered, close connection
      if (order.status === 'DELIVERED') {
        sendEvent({ message: 'Order delivered', status: 'DELIVERED' });
        res.end();
        decrementSSEConnections();
        return;
      }

      // Move to next status
      currentStatusIndex++;
      if (currentStatusIndex >= statusFlow.length) {
        res.end();
        decrementSSEConnections();
        return;
      }

      const nextStatus = statusFlow[currentStatusIndex];
      
      // Update database
      order.status = nextStatus;
      order.updatedAt = new Date();
      await order.save();

      // Send event
      sendEvent({
        orderId: order._id,
        status: order.status,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        updatedAt: order.updatedAt,
        message: `Order status updated to ${nextStatus}`
      });

      // If delivered, close connection
      if (nextStatus === 'DELIVERED') {
        setTimeout(() => {
          res.end();
          decrementSSEConnections();
        }, 1000);
      } else {
        // Schedule next progression
        const delay = Math.floor(Math.random() * 3000) + 4000; // 4-7 seconds
        setTimeout(progressOrder, delay);
      }
    };

    // Start auto-progression after initial send
    if (order.status !== 'DELIVERED') {
      const initialDelay = Math.floor(Math.random() * 2000) + 3000; // 3-5 seconds
      setTimeout(progressOrder, initialDelay);
    } else {
      // Already delivered, close after initial send
      setTimeout(() => {
        res.end();
        decrementSSEConnections();
      }, 1000);
    }

  } catch (err) {
    sendEvent({ error: err.message });
    res.end();
    decrementSSEConnections();
  }

  // Handle client disconnect
  req.on('close', () => {
    decrementSSEConnections();
  });
});

module.exports = router;