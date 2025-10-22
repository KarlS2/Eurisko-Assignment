// routes/assistant.js
// API routes for Karobot assistant with session management

const express = require('express');
const router = express.Router();
const { processQuery, getStats, clearSession } = require('../assistant/engine');
const { classifyIntent } = require('../assistant/intent-classifier');
const { registry } = require('../assistant/function-registry');
const crypto = require('crypto');

// Track assistant metrics for dashboard
let assistantMetrics = {
  totalQueries: 0,
  intentDistribution: {},
  functionCallDistribution: {},
  averageResponseTime: 0,
  totalResponseTime: 0,
  errors: 0
};

/**
 * Generate session ID if not provided
 */
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * POST /api/assistant/chat
 * Main chat endpoint with session support
 */
router.post('/chat', async (req, res) => {
  try {
    let { query, sessionId } = req.body;
    
    // Validate input
    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
        success: false
      });
    }
    
    // Generate sessionId if not provided
    if (!sessionId) {
      sessionId = generateSessionId();
      console.log(`[Assistant API] Created new session: ${sessionId}`);
    }
    
    // Process query with session context
    const response = await processQuery(query, { sessionId });
    
    // Update metrics
    assistantMetrics.totalQueries++;
    assistantMetrics.totalResponseTime += response.processingTime;
    assistantMetrics.averageResponseTime = 
      assistantMetrics.totalResponseTime / assistantMetrics.totalQueries;
    
    // Track intent distribution
    const intent = response.intentClassification?.intent || 'unknown';
    assistantMetrics.intentDistribution[intent] = 
      (assistantMetrics.intentDistribution[intent] || 0) + 1;
    
    // Track function calls
    if (response.functionsCalled) {
      for (const func of response.functionsCalled) {
        assistantMetrics.functionCallDistribution[func] = 
          (assistantMetrics.functionCallDistribution[func] || 0) + 1;
      }
    }
    
    // Track errors
    if (response.intent === 'error') {
      assistantMetrics.errors++;
    }
    
    // Return response with sessionId
    res.json({
      success: true,
      ...response,
      sessionId // Always return sessionId so client can maintain it
    });
    
  } catch (error) {
    console.error('[Assistant API] Error:', error);
    assistantMetrics.errors++;
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/assistant/session/:sessionId
 * Clear conversation context for a session
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }
    
    const cleared = clearSession(sessionId);
    
    res.json({
      success: true,
      cleared,
      message: cleared 
        ? 'Session cleared successfully' 
        : 'Session not found (may have expired)'
    });
    
  } catch (error) {
    console.error('[Assistant API] Session clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/assistant/classify
 * Intent classification only (for testing)
 */
router.post('/classify', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
        success: false
      });
    }
    
    const result = await classifyIntent(query);
    
    res.json({
      success: true,
      query,
      ...result
    });
    
  } catch (error) {
    console.error('[Assistant API] Classification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/assistant/functions
 * Get available functions and schemas
 */
router.get('/functions', (req, res) => {
  try {
    const schemas = registry.getAllSchemas();
    const stats = registry.getStats();
    
    res.json({
      success: true,
      count: schemas.length,
      functions: schemas,
      stats
    });
    
  } catch (error) {
    console.error('[Assistant API] Functions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/assistant/function/:name
 * Execute a specific function (for testing)
 */
router.post('/function/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const params = req.body;
    
    const result = await registry.execute(name, params);
    
    res.json({
      success: result.success,
      function: name,
      ...result
    });
    
  } catch (error) {
    console.error('[Assistant API] Function execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/assistant/stats
 * Get assistant statistics
 */
router.get('/stats', (req, res) => {
  try {
    const engineStats = getStats();
    
    res.json({
      success: true,
      metrics: assistantMetrics,
      engine: engineStats,
      uptime: process.uptime()
    });
    
  } catch (error) {
    console.error('[Assistant API] Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/assistant/health
 * Health check for assistant
 */
router.get('/health', (req, res) => {
  try {
    const engineStats = getStats();
    
    const isHealthy = 
      engineStats.configLoaded.prompts &&
      engineStats.configLoaded.groundTruth &&
      engineStats.configLoaded.policyCount > 0;
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks: {
        promptsLoaded: engineStats.configLoaded.prompts,
        groundTruthLoaded: engineStats.configLoaded.groundTruth,
        policyCount: engineStats.configLoaded.policyCount,
        functionsRegistered: Object.keys(engineStats.functionStats).length,
        activeSessions: engineStats.activeSessions
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * GET /api/assistant/metrics (for dashboard)
 * Get metrics for admin dashboard
 */
router.get('/metrics', (req, res) => {
  try {
    res.json({
      success: true,
      totalQueries: assistantMetrics.totalQueries,
      intentDistribution: assistantMetrics.intentDistribution,
      functionCalls: assistantMetrics.functionCallDistribution,
      averageResponseTime: Math.round(assistantMetrics.averageResponseTime),
      errorRate: assistantMetrics.totalQueries > 0 
        ? (assistantMetrics.errors / assistantMetrics.totalQueries * 100).toFixed(2) + '%'
        : '0%',
      errors: assistantMetrics.errors
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;