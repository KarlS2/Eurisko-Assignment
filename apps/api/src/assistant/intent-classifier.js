// intent-classifier.js
// Hybrid intent detection: keyword matching + LLM fallback

const axios = require('axios');

// Intent definitions with keywords (from prompts.yaml)
const INTENT_DEFINITIONS = {
  policy_question: {
    keywords: ['policy', 'return', 'refund', 'shipping', 'delivery', 'warranty', 
               'commission', 'fee', 'cost', 'price', 'how long', 'how much', 
               'timeframe', 'requirement', 'minimum', 'maximum'],
    weight: 1.0
  },
  
  order_status: {
    keywords: ['order', 'track', 'tracking', 'where is', 'status', 'delivery', 
               'shipped', 'arrived', 'package', 'my order'],
    weight: 1.2 // Slightly higher priority
  },
  
  product_search: {
    keywords: ['looking for', 'find', 'search', 'product', 'item', 'sell', 
               'available', 'stock', 'show me', 'do you have', 'where can i find'],
    weight: 1.0
  },
  
  complaint: {
    keywords: ['problem', 'issue', 'wrong', 'broken', 'damaged', 'unhappy', 
               'disappointed', 'terrible', 'awful', 'bad', 'complaint', 
               'not working', 'doesn\'t work', 'hate', 'frustrated'],
    weight: 1.3 // High priority for complaints
  },
  
  chitchat: {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 
               'good evening', 'how are you', 'what\'s up', 'thanks', 
               'thank you', 'bye', 'goodbye', 'who are you', 'what is your name'],
    weight: 0.8 // Lower priority
  },
  
  off_topic: {
    keywords: ['weather', 'news', 'politics', 'recipe', 'movie', 'sports', 
               'celebrity', 'joke', 'game', 'music', 'tv show'],
    weight: 0.9
  },
  
  violation: {
    // FIXED: More specific patterns to avoid false positives
    keywords: ['fucking', 'shitting', 'bitching', 'asshole', 'bastard'],
    weight: 2.0 // Highest priority
  }
};

// FIXED: More precise profanity patterns with word boundaries
const PROFANITY_PATTERNS = [
  /\bf[u*]+ck(ing|ed|er)?\b/i,
  /\bsh[i*]+t(ting|ty)?\b/i,
  /\bb[i*]+tch(es|ing)?\b/i,
  /\ba[s*]+hole\b/i,
  /\bbastard\b/i,
  /\bmoron\b/i,
  /\bidiot\b/i,
  /\bdamn you\b/i,  // Only "damn you", not just "damn"
  /\bgo to hell\b/i, // Full phrase, not just "hell"
  /\bkill yourself\b/i,
  /\bdie\b.*\b(you|bitch|asshole)\b/i // "die" with offensive context
];

/**
 * Calculate keyword match score for an intent
 * @param {string} query - User query
 * @param {Array} keywords - Intent keywords
 * @param {number} weight - Intent weight multiplier
 * @returns {number} Match score
 */
function calculateKeywordScore(query, keywords, weight = 1.0) {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    // Use word boundaries for single words to avoid partial matches
    if (!keyword.includes(' ')) {
      const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (wordBoundaryRegex.test(queryLower)) {
        const keywordWeight = 1;
        score += keywordWeight;
      }
    } else {
      // For phrases, use simple includes
      if (queryLower.includes(keywordLower)) {
        const keywordWeight = keyword.split(' ').length;
        score += keywordWeight;
      }
    }
  }
  
  return score * weight;
}

/**
 * Check for profanity/violations
 * FIXED: More precise pattern matching
 * @param {string} query - User query
 * @returns {boolean} True if violation detected
 */
function containsViolation(query) {
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(query)) {
      console.log(`[Intent] Violation detected by pattern: ${pattern}`);
      return true;
    }
  }
  return false;
}

/**
 * Extract order ID from query
 * @param {string} query - User query
 * @returns {string|null} Order ID if found
 */
function extractOrderId(query) {
  // Try to match various order ID formats
  // 1. MongoDB ObjectId (24 hex chars)
  let match = query.match(/\b[a-f0-9]{24}\b/i);
  if (match) return match[0];
  
  // 2. Tracking number (TRK + alphanumeric)
  match = query.match(/\bTRK[A-Z0-9]{10,}\b/i);
  if (match) return match[0];
  
  // 3. Order reference (ORD + alphanumeric)
  match = query.match(/\bORD[A-Z0-9]{10,}\b/i);
  if (match) return match[0];
  
  // 4. Generic alphanumeric (10+ chars)
  match = query.match(/\b[A-Z0-9]{10,}\b/);
  if (match) return match[0];
  
  return null;
}

/**
 * Keyword-based intent classification
 * @param {string} query - User query
 * @returns {Object} { intent, confidence, scores }
 */
function classifyByKeywords(query) {
  // Check for violations first
  if (containsViolation(query)) {
    return {
      intent: 'violation',
      confidence: 1.0,
      method: 'keyword',
      scores: { violation: 100 }
    };
  }
  
  // Check for order ID (strong signal for order_status)
  const orderId = extractOrderId(query);
  if (orderId) {
    return {
      intent: 'order_status',
      confidence: 0.95,
      method: 'keyword',
      orderId,
      scores: { order_status: 50 }
    };
  }
  
  // Calculate scores for all intents
  const scores = {};
  for (const [intent, config] of Object.entries(INTENT_DEFINITIONS)) {
    scores[intent] = calculateKeywordScore(query, config.keywords, config.weight);
  }
  
  // Find best match
  const sortedIntents = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);
  
  const [bestIntent, bestScore] = sortedIntents[0];
  const [secondIntent, secondScore] = sortedIntents[1] || [null, 0];
  
  // Confidence based on score and margin
  let confidence = 0;
  if (bestScore === 0) {
    confidence = 0; // No matches
  } else if (bestScore > 0 && secondScore === 0) {
    confidence = 0.9; // Clear winner
  } else {
    // Confidence based on margin between top two
    const margin = bestScore - secondScore;
    confidence = Math.min(0.9, 0.5 + (margin / bestScore) * 0.4);
  }
  
  return {
    intent: bestScore > 0 ? bestIntent : 'off_topic',
    confidence,
    method: 'keyword',
    scores
  };
}

/**
 * LLM-based intent classification (fallback for ambiguous cases)
 * @param {string} query - User query
 * @param {string} llmEndpoint - LLM API endpoint
 * @returns {Promise<Object>} { intent, confidence, method }
 */
async function classifyByLLM(query, llmEndpoint) {
  const prompt = `You are an intent classifier for a customer support chatbot.

Classify the following customer query into ONE of these intents:
1. policy_question - Questions about policies, shipping, returns, fees, requirements
2. order_status - Questions about order tracking, delivery status
3. product_search - Looking for products or product information
4. complaint - Expressing dissatisfaction, problems, or complaints
5. chitchat - Greetings, thanks, casual conversation
6. off_topic - Questions unrelated to e-commerce support
7. violation - Abusive, offensive, or inappropriate content

Customer query: "${query}"

Respond with ONLY the intent name (no explanation):`;

  try {
    const response = await axios.post(
      llmEndpoint,
      {
        prompt,
        max_tokens: 20,
        temperature: 0.3 // Low temperature for deterministic classification
      },
      {
        timeout: 50000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const intentText = response.data.text.trim().toLowerCase();
    
    // Validate intent
    const validIntents = Object.keys(INTENT_DEFINITIONS);
    const matchedIntent = validIntents.find(intent => 
      intentText.includes(intent.replace('_', ' ')) || intentText.includes(intent)
    );
    
    return {
      intent: matchedIntent || 'off_topic',
      confidence: matchedIntent ? 0.85 : 0.5,
      method: 'llm'
    };
    
  } catch (error) {
    console.error('LLM classification error:', error.message);
    // Fallback to off_topic on error
    return {
      intent: 'off_topic',
      confidence: 0.3,
      method: 'llm_error'
    };
  }
}

/**
 * Main intent classification function (hybrid approach)
 * @param {string} query - User query
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Classification result
 */
async function classifyIntent(query, options = {}) {
  const {
    llmEndpoint = process.env.LLM_ENDPOINT,
    useLLMFallback = true,
    confidenceThreshold = 0.7
  } = options;
  
  // Validate input
  if (!query || typeof query !== 'string') {
    return {
      intent: 'off_topic',
      confidence: 0,
      method: 'invalid_input',
      error: 'Invalid query'
    };
  }
  
  // Trim and check length
  query = query.trim();
  if (query.length === 0) {
    return {
      intent: 'chitchat',
      confidence: 0.5,
      method: 'empty_query'
    };
  }
  
  // Start with keyword classification
  const keywordResult = classifyByKeywords(query);
  
  // If high confidence or no LLM fallback, return keyword result
  if (keywordResult.confidence >= confidenceThreshold || !useLLMFallback || !llmEndpoint) {
    return keywordResult;
  }
  
  // Low confidence - use LLM fallback
  console.log(`[Intent] Low confidence (${keywordResult.confidence.toFixed(2)}), using LLM fallback`);
  
  try {
    const llmResult = await classifyByLLM(query, llmEndpoint);
    
    // If LLM agrees with keyword result, boost confidence
    if (llmResult.intent === keywordResult.intent) {
      return {
        intent: keywordResult.intent,
        confidence: Math.min(0.95, keywordResult.confidence + 0.2),
        method: 'hybrid_agreement',
        keywordScores: keywordResult.scores
      };
    }
    
    // LLM disagrees - prefer LLM for ambiguous cases
    return {
      intent: llmResult.intent,
      confidence: llmResult.confidence,
      method: 'hybrid_llm',
      keywordIntent: keywordResult.intent,
      keywordScores: keywordResult.scores
    };
    
  } catch (error) {
    // LLM failed - fall back to keyword result
    console.error('[Intent] LLM fallback failed, using keyword result');
    return {
      ...keywordResult,
      llmFallbackFailed: true
    };
  }
}

/**
 * Batch classify multiple queries (for testing)
 * @param {Array<string>} queries - Array of queries
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of classification results
 */
async function classifyBatch(queries, options = {}) {
  const results = [];
  for (const query of queries) {
    const result = await classifyIntent(query, options);
    results.push({ query, ...result });
  }
  return results;
}

module.exports = {
  classifyIntent,
  classifyBatch,
  extractOrderId,
  containsViolation,
  INTENT_DEFINITIONS
};