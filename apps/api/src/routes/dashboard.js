// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { Order } = require('../db');

// In-memory tracking for performance metrics
const performanceMetrics = {
  apiLatency: [],
  sseConnections: 0,
  llmResponseTimes: {},
  failedRequests: 0,
  lastUpdate: new Date()
};

const assistantMetrics = {
  totalQueries: 0,
  intentDistribution: {},
  functionCalls: {},
  avgResponseTime: {}
};

// Middleware to track API latency
const trackLatency = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMetrics.apiLatency.push({
      endpoint: req.path,
      duration,
      timestamp: new Date()
    });
    // Keep only last 100 requests
    if (performanceMetrics.apiLatency.length > 100) {
      performanceMetrics.apiLatency.shift();
    }
  });
  next();
};

// GET business metrics
router.get('/business-metrics', async (req, res) => {
  try {
    const metrics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" }
        }
      }
    ]);

    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueTrend = await Order.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          orderCount: 1
        }
      }
    ]);

    res.json({
      totalRevenue: metrics[0]?.totalRevenue || 0,
      totalOrders: metrics[0]?.totalOrders || 0,
      avgOrderValue: metrics[0]?.avgOrderValue || 0,
      ordersByStatus: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      revenueTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET performance metrics
router.get('/performance', (req, res) => {
  try {
    const avgLatency = performanceMetrics.apiLatency.length > 0
      ? performanceMetrics.apiLatency.reduce((sum, m) => sum + m.duration, 0) / 
        performanceMetrics.apiLatency.length
      : 0;

    res.json({
      avgApiLatency: Math.round(avgLatency),
      sseConnections: performanceMetrics.sseConnections,
      failedRequests: performanceMetrics.failedRequests,
      lastUpdate: performanceMetrics.lastUpdate,
      recentRequests: performanceMetrics.apiLatency.slice(-10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET assistant stats
router.get('/assistant-stats', (req, res) => {
  try {
    res.json({
      totalQueries: assistantMetrics.totalQueries,
      intentDistribution: assistantMetrics.intentDistribution,
      functionCalls: assistantMetrics.functionCalls,
      avgResponseTime: assistantMetrics.avgResponseTime
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST to update assistant metrics (called by assistant engine)
router.post('/assistant-stats', (req, res) => {
  try {
    const { intent, functionsCalled, responseTime } = req.body;

    assistantMetrics.totalQueries++;

    if (intent) {
      assistantMetrics.intentDistribution[intent] = 
        (assistantMetrics.intentDistribution[intent] || 0) + 1;
    }

    if (functionsCalled) {
      functionsCalled.forEach(fn => {
        assistantMetrics.functionCalls[fn] = 
          (assistantMetrics.functionCalls[fn] || 0) + 1;
      });
    }

    if (responseTime && intent) {
      if (!assistantMetrics.avgResponseTime[intent]) {
        assistantMetrics.avgResponseTime[intent] = [];
      }
      assistantMetrics.avgResponseTime[intent].push(responseTime);
      // Keep only last 20 measurements
      if (assistantMetrics.avgResponseTime[intent].length > 20) {
        assistantMetrics.avgResponseTime[intent].shift();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper functions to update metrics from other modules
const incrementSSEConnections = () => {
  performanceMetrics.sseConnections++;
};

const decrementSSEConnections = () => {
  performanceMetrics.sseConnections = Math.max(0, performanceMetrics.sseConnections - 1);
};

const incrementFailedRequests = () => {
  performanceMetrics.failedRequests++;
};

module.exports = router;
module.exports.trackLatency = trackLatency;
module.exports.incrementSSEConnections = incrementSSEConnections;
module.exports.decrementSSEConnections = decrementSSEConnections;
module.exports.incrementFailedRequests = incrementFailedRequests;