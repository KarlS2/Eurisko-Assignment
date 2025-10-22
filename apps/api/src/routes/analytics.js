// routes/analytics.js
const express = require('express');
const router = express.Router();
const { Order } = require('../db');

// GET daily revenue using database aggregation
router.get('/daily-revenue', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ 
        error: 'Both "from" and "to" date parameters are required (YYYY-MM-DD)' 
      });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // End of day

    if (isNaN(fromDate) || isNaN(toDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // CRITICAL: Use MongoDB aggregation (NOT JavaScript reduce)
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
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

    res.json(dailyRevenue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET dashboard metrics
router.get('/dashboard-metrics', async (req, res) => {
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

    res.json({
      totalRevenue: metrics[0]?.totalRevenue || 0,
      totalOrders: metrics[0]?.totalOrders || 0,
      avgOrderValue: metrics[0]?.avgOrderValue || 0,
      ordersByStatus: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;