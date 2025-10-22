// engine.js
// Main assistant orchestration engine with context memory and enhanced responses

const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { classifyIntent, extractOrderId } = require('./intent-classifier');
const { registry } = require('./function-registry');

// Load configuration
const promptsPath = path.join(__dirname, '../../../../docs/prompts.yaml');
const groundTruthPath = path.join(__dirname, '../../../../docs/ground-truth.json');

console.log('[Engine] Looking for ground-truth.json at:', groundTruthPath);
console.log('[Engine] File exists?', fs.existsSync(groundTruthPath));

let PROMPTS_CONFIG = null;
let GROUND_TRUTH = null;

// Load configs on startup
try {
  PROMPTS_CONFIG = yaml.load(fs.readFileSync(promptsPath, 'utf8'));
  GROUND_TRUTH = JSON.parse(fs.readFileSync(groundTruthPath, 'utf8'));
  console.log('[Engine] Loaded prompts.yaml and ground-truth.json');
  console.log(`[Engine] Loaded ${GROUND_TRUTH.length} policies`);
} catch (error) {
  console.error('[Engine] Failed to load config files:', error.message);
}

// ============================================================================
// CONVERSATION CONTEXT MANAGEMENT (In-Memory)
// ============================================================================
const conversationContexts = new Map(); // sessionId -> { messages: [], createdAt: timestamp, lastActivity: timestamp }
const MAX_CONTEXT_MESSAGES = 5;
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * Clean up old sessions periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, context] of conversationContexts.entries()) {
    if (now - context.lastActivity > SESSION_TIMEOUT) {
      conversationContexts.delete(sessionId);
      console.log(`[Engine] Cleaned up expired session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

/**
 * Get or create conversation context
 */
function getContext(sessionId) {
  if (!sessionId) return null;
  
  if (!conversationContexts.has(sessionId)) {
    conversationContexts.set(sessionId, {
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userGreeted: false,
      userName: null
    });
  }
  
  return conversationContexts.get(sessionId);
}

/**
 * Add message to context
 */
function addToContext(sessionId, role, content, metadata = {}) {
  const context = getContext(sessionId);
  if (!context) return;
  
  context.messages.push({
    role, // 'user' or 'assistant'
    content,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Keep only last MAX_CONTEXT_MESSAGES messages
  if (context.messages.length > MAX_CONTEXT_MESSAGES * 2) { // *2 because we store both user and assistant
    context.messages = context.messages.slice(-MAX_CONTEXT_MESSAGES * 2);
  }
  
  context.lastActivity = Date.now();
}

/**
 * Get conversation summary for context
 */
function getConversationSummary(sessionId) {
  const context = getContext(sessionId);
  if (!context || context.messages.length === 0) return null;
  
  const recentMessages = context.messages.slice(-6); // Last 3 exchanges
  return recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
}

// ============================================================================
// ENHANCED POLICY MATCHING (Using keywords from ground-truth.json)
// ============================================================================

/**
 * Enhanced policy matching using keywords array
 */
function findRelevantPolicies(query, maxPolicies = 3) {
  if (!GROUND_TRUTH) {
    console.log('[Engine] Ground truth not loaded');
    return [];
  }
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const scored = [];
  
  for (const policy of GROUND_TRUTH) {
    let score = 0;
    
    // HIGH PRIORITY: Match against policy keywords (from ground-truth.json)
    if (policy.keywords && Array.isArray(policy.keywords)) {
      for (const keyword of policy.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (queryLower.includes(keywordLower)) {
          score += 5; // High weight for official keywords
        }
      }
    }
    
    // MEDIUM PRIORITY: Category match
    if (queryLower.includes(policy.category.toLowerCase())) {
      score += 3;
    }
    
    // MEDIUM PRIORITY: Question keyword overlap
    const questionWords = policy.question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    for (const qWord of questionWords) {
      if (queryWords.includes(qWord)) {
        score += 2;
      }
    }
    
    // LOW PRIORITY: Answer content match (for specific terms)
    const answerWords = policy.answer.toLowerCase().split(/\s+/);
    for (const word of queryWords) {
      if (word.length > 4 && answerWords.includes(word)) {
        score += 1;
      }
    }
    
    if (score > 0) {
      scored.push({ policy, score });
    }
  }
  
  // Sort by score and return top matches
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, maxPolicies).map(s => s.policy);
  
  console.log(`[Engine] Found ${results.length} relevant policies for query: "${query}"`);
  if (results.length > 0) {
    console.log(`[Engine] Top match: ${results[0].id} (${results[0].category})`);
  }
  
  return results;
}

/**
 * Validate citations in response
 */
function validateCitations(response) {
  if (!GROUND_TRUTH) {
    return {
      isValid: true,
      validCitations: [],
      invalidCitations: [],
      warning: 'Ground truth not loaded'
    };
  }
  
  // Extract citations [PolicyX.X]
  const citationPattern = /\[([A-Za-z0-9.]+)\]/g;
  const citations = [];
  let match;
  
  while ((match = citationPattern.exec(response)) !== null) {
    citations.push(match[1]);
  }
  
  if (citations.length === 0) {
    return {
      isValid: true,
      validCitations: [],
      invalidCitations: [],
      noCitations: true
    };
  }
  
  // Validate each citation
  const validIds = new Set(GROUND_TRUTH.map(p => p.id));
  const validCitations = [];
  const invalidCitations = [];
  
  for (const citation of citations) {
    if (validIds.has(citation)) {
      validCitations.push(citation);
    } else {
      invalidCitations.push(citation);
    }
  }
  
  return {
    isValid: invalidCitations.length === 0,
    validCitations,
    invalidCitations,
    totalCitations: citations.length
  };
}

// ============================================================================
// LLM GENERATION
// ============================================================================

/**
 * Generate response using LLM with context awareness
 */
async function generateResponse(prompt, options = {}) {
  const {
    maxTokens = 500,
    temperature = 0.7,
    timeout = 100000
  } = options;
  
  const llmEndpoint = process.env.LLM_ENDPOINT;
  
  if (!llmEndpoint) {
    console.log('[Engine] LLM_ENDPOINT not configured, skipping LLM call');
    return null;
  }
  
  try {
    console.log(`[Engine] Calling LLM at ${llmEndpoint}`);
    
    const response = await axios.post(
      llmEndpoint,
      {
        prompt,
        max_tokens: maxTokens,
        temperature
      },
      {
        timeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const text = response.data.text?.trim();
    
    if (!text || text.length < 10) {
      console.log('[Engine] LLM returned empty or too short response');
      return null;
    }
    
    console.log('[Engine] LLM response received successfully');
    return text;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[Engine] LLM endpoint unreachable (connection refused)');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('[Engine] LLM request timed out');
    } else {
      console.error('[Engine] LLM generation error:', error.message);
    }
    return null;
  }
}

/**
 * Build prompt for intent with conversation context
 */
function buildPrompt(intent, query, context = {}, sessionId = null) {
  if (!PROMPTS_CONFIG) {
    throw new Error('Prompts configuration not loaded');
  }
  
  const baseSystemPrompt = PROMPTS_CONFIG.prompt_templates.base_system_prompt;
  
  // Add conversation context if available
  let contextSection = '';
  if (sessionId) {
    const conversationSummary = getConversationSummary(sessionId);
    if (conversationSummary) {
      contextSection = `\n\nPREVIOUS CONVERSATION:\n${conversationSummary}\n`;
    }
  }
  
  let specificPrompt = '';
  
  switch (intent) {
    case 'policy_question':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.policy_question_prompt
        .replace('{grounded_policies}', context.policies || 'No policies found')
        .replace('{user_query}', query);
      break;
      
    case 'order_status':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.order_status_prompt
        .replace('{order_details}', context.orderDetails || 'Order not found')
        .replace('{user_query}', query);
      break;
      
    case 'product_search':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.product_search_prompt
        .replace('{product_results}', context.productResults || 'No products found')
        .replace('{user_query}', query);
      break;
      
    case 'complaint':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.complaint_prompt
        .replace('{user_query}', query)
        .replace('{context}', context.additionalInfo || '');
      break;
      
    case 'chitchat':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.chitchat_prompt
        .replace('{user_query}', query);
      break;
      
    case 'off_topic':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.off_topic_prompt
        .replace('{user_query}', query);
      break;
      
    case 'violation':
      specificPrompt = PROMPTS_CONFIG.prompt_templates.violation_prompt;
      break;
      
    default:
      specificPrompt = `User query: ${query}\n\nRespond as Karobot:`;
  }
  
  return `${baseSystemPrompt}${contextSection}\n\n${specificPrompt}`;
}

// ============================================================================
// INTENT HANDLERS
// ============================================================================

/**
 * Handle policy question intent
 */
async function handlePolicyQuestion(query, sessionId = null) {
  console.log('[Engine] Handling policy question:', query);
  
  // Find relevant policies using enhanced matching
  const policies = findRelevantPolicies(query, 3);
  
  if (policies.length === 0) {
    return {
      text: "I apologize, but I don't have specific information about that in our policy documentation. Please contact our support team at support@shoplite.com for detailed assistance.",
      intent: 'policy_question',
      citations: [],
      confidence: 'low'
    };
  }
  
  // Format policies for prompt
  const policiesText = policies.map(p => 
    `[${p.id}] ${p.question}\n${p.answer}`
  ).join('\n\n');
  
  let responseText;
  let usedFallback = false;
  
  try {
    // Try LLM first
    const prompt = buildPrompt('policy_question', query, { policies: policiesText }, sessionId);
    responseText = await generateResponse(prompt);
    
    if (!responseText) {
      throw new Error('LLM returned null');
    }
  } catch (error) {
    // Fallback: Use the first policy's answer directly
    console.log('[Engine] Using fallback response for policy question');
    usedFallback = true;
    const mainPolicy = policies[0];
    responseText = `${mainPolicy.answer} [${mainPolicy.id}]`;
    
    // If multiple policies found, mention them
    if (policies.length > 1) {
      responseText += `\n\nRelated policies: ${policies.slice(1).map(p => `[${p.id}]`).join(', ')}`;
    }
  }
  
  // Validate citations
  const citationValidation = validateCitations(responseText);
  
  return {
    text: responseText,
    intent: 'policy_question',
    citations: citationValidation.validCitations,
    invalidCitations: citationValidation.invalidCitations,
    confidence: citationValidation.isValid && !usedFallback ? 'high' : 'medium',
    groundedPolicies: policies.map(p => p.id),
    usedFallback
  };
}

/**
 * Handle order status intent (ENHANCED: Better error handling and messaging)
 */
async function handleOrderStatus(query, sessionId = null) {
  console.log('[Engine] Handling order status:', query);
  
  // Extract order ID
  const orderId = extractOrderId(query);
  
  if (!orderId) {
    return {
      text: "I'd be happy to help you track your order! Could you please provide your order ID? You can find it in your confirmation email or in the 'My Orders' section of your account. It looks like a long code (e.g., 67163abc4f2d9e1a3b5c8f7e).",
      intent: 'order_status',
      confidence: 'medium',
      needsOrderId: true
    };
  }
  
  // Call getOrderStatus function
  let result;
  try {
    console.log(`[Engine] Looking up order: ${orderId}`);
    result = await registry.execute('getOrderStatus', { orderId });
    console.log(`[Engine] Order lookup result:`, result.success ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error(`[Engine] Order lookup exception:`, error);
    return {
      text: `I encountered a technical issue looking up that order. Please try again in a moment, or contact our support team at support@shoplite.com if the issue persists.`,
      intent: 'order_status',
      confidence: 'low',
      error: error.message
    };
  }
  
  if (!result.success) {
    console.error(`[Engine] Order lookup failed:`, result.error);
    return {
      text: `I had trouble finding that order. This could mean:\n• The order ID might be incorrect\n• The order might be from a different account\n\nPlease double-check the order ID in your confirmation email, or visit the 'My Orders' section. Our support team at support@shoplite.com can also help!`,
      intent: 'order_status',
      confidence: 'low',
      error: result.error
    };
  }
  
  if (!result.data.found) {
    return {
      text: `I couldn't find an order with ID ${orderId}. Please check:\n• The order ID is correct (found in your confirmation email)\n• You're using the right account\n\nNeed help? Contact support@shoplite.com or use our live chat!`,
      intent: 'order_status',
      confidence: 'high',
      orderFound: false,
      orderId
    };
  }
  
  // Format order details for prompt
  const orderDetailsText = `
Order ID: ${result.data.orderId}
Status: ${result.data.status}
Total: $${result.data.total.toFixed(2)}
Items: ${result.data.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
${result.data.carrier ? `Carrier: ${result.data.carrier}` : ''}
${result.data.trackingNumber ? `Tracking: ${result.data.trackingNumber}` : ''}
${result.data.estimatedDelivery ? `Estimated Delivery: ${new Date(result.data.estimatedDelivery).toLocaleDateString()}` : ''}
Order Date: ${new Date(result.data.createdAt).toLocaleDateString()}
  `.trim();
  
  let responseText;
  
  try {
    // Try LLM
    const prompt = buildPrompt('order_status', query, { orderDetails: orderDetailsText }, sessionId);
    responseText = await generateResponse(prompt);
    
    if (!responseText) {
      throw new Error('LLM returned null');
    }
  } catch (error) {
    // Fallback: Enhanced status message
    console.log('[Engine] Using fallback response for order status');
    const order = result.data;
    const shortId = order.orderId.substring(order.orderId.length - 8);
    
    responseText = `Great news! I found your order (...${shortId}).\n\n`;
    responseText += `📦 Status: ${order.status}\n`;
    responseText += `💰 Total: $${order.total.toFixed(2)}\n`;
    responseText += `📅 Ordered: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
    
    if (order.status === 'SHIPPED' && order.carrier) {
      responseText += `Your order is on its way via ${order.carrier}! `;
      if (order.estimatedDelivery) {
        responseText += `Expected delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}.`;
      }
    } else if (order.status === 'DELIVERED') {
      responseText += '✅ Your order has been delivered!';
    } else if (order.status === 'PROCESSING') {
      responseText += '⏳ We\'re preparing your order for shipment. You\'ll receive tracking info soon!';
    } else if (order.status === 'PENDING') {
      responseText += '🔄 Your order is confirmed and will be processed shortly.';
    }
  }
  
  return {
    text: responseText,
    intent: 'order_status',
    confidence: 'high',
    orderFound: true,
    orderId,
    orderData: result.data,
    functionsCalled: ['getOrderStatus']
  };
}

/**
 * Handle product search intent
 */
/**
 * Extract product keywords from search query
 * Removes common search phrases and stop words
 */
function extractProductKeywords(query) {
  let keywords = query.toLowerCase();
  
  // Remove punctuation
  keywords = keywords.replace(/[?!.,;:'"]/g, ' ');
  
  // Remove common search phrases (order matters - remove longer phrases first)
  const searchPhrases = [
    'do you sell', 'do you have', 'do you carry', 'do you stock',
    'are there any', 'can i get', 'can i buy', 'can i purchase', 
    'can i find', 'where can i get', 'where can i buy', 'where can i find',
    'i am looking for', 'i\'m looking for', 'looking for', 'searching for',
    'search for', 'find me', 'show me', 'i need', 'i want', 
    'i would like', 'what about', 'how about', 'any'
  ];
  
  for (const phrase of searchPhrases) {
    const regex = new RegExp(phrase, 'gi');
    keywords = keywords.replace(regex, ' ');
  }
  
  // Remove single-character words and common stop words
  const stopWords = [
    'a', 'an', 'the', 'is', 'are', 'do', 'you', 'have', 'got',
    'get', 'some', 'what', 'how', 'when', 'where', 'there'
  ];
  
  keywords = keywords
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .join(' ')
    .trim();
  
  // If nothing left after filtering, return original query
  return keywords.length > 0 ? keywords : query;
}

/**
 * Expand search query with category aliases and related terms
 * This helps match products even if user uses different terminology
 */
function expandSearchQuery(query) {
  const queryLower = query.toLowerCase();
  const expansions = new Set([query]); // Start with original query
  
  // Category aliases - map user terms to your actual categories
  const categoryMap = {
    // Laptops & Computers
    'laptop': ['laptops', 'notebook', 'computer'],
    'laptops': ['laptop', 'notebooks', 'computers'],
    'notebook': ['laptops', 'laptop', 'computer'],
    'computer': ['laptops', 'laptop', 'desktop'],
    
    // Phones & Smartphones
    'phone': ['smartphones', 'mobile', 'cellphone'],
    'phones': ['smartphones', 'mobile', 'cellphones'],
    'smartphone': ['smartphones', 'phone', 'mobile'],
    'mobile': ['smartphones', 'phone'],
    'iphone': ['smartphones', 'apple', 'phone'],
    'android': ['smartphones', 'phone'],
    
    // Gaming
    'gaming': ['gaming', 'games', 'console', 'gamer'],
    'console': ['gaming', 'playstation', 'xbox', 'nintendo'],
    'playstation': ['gaming', 'console', 'ps5'],
    'xbox': ['gaming', 'console'],
    'nintendo': ['gaming', 'console', 'switch'],
    
    // Audio
    'headphones': ['audio', 'headset', 'earphones', 'earbuds'],
    'headset': ['audio', 'headphones', 'gaming'],
    'earbuds': ['audio', 'headphones', 'wireless', 'airpods'],
    'speakers': ['audio', 'bluetooth', 'portable'],
    'airpods': ['audio', 'apple', 'wireless', 'earbuds'],
    
    // Accessories
    'mouse': ['accessories', 'gaming', 'peripherals'],
    'keyboard': ['accessories', 'gaming', 'peripherals'],
    'charger': ['accessories', 'charging', 'power'],
    'cable': ['accessories', 'charging', 'usb'],
    'case': ['accessories', 'protection'],
    
    // Wearables
    'watch': ['wearables', 'smartwatch', 'fitness'],
    'smartwatch': ['wearables', 'watch', 'fitness'],
    'fitness': ['wearables', 'smartwatch', 'health'],
    
    // Tablets
    'tablet': ['tablets', 'ipad'],
    'ipad': ['tablets', 'apple', 'tablet'],
    
    // Monitors & Displays
    'monitor': ['monitors', 'display', 'screen'],
    'display': ['monitors', 'screen'],
    'screen': ['monitors', 'display'],
    
    // Storage
    'ssd': ['storage', 'drive', 'external'],
    'storage': ['ssd', 'drive', 'external'],
    'drive': ['storage', 'ssd', 'external']
  };
  
  // Check if query matches any category alias
  for (const [term, aliases] of Object.entries(categoryMap)) {
    if (queryLower.includes(term)) {
      // Add all aliases to search
      aliases.forEach(alias => expansions.add(alias));
    }
  }
  
  // Brand detection - add brand-specific terms
  const brands = {
    'apple': ['iphone', 'ipad', 'macbook', 'airpods', 'watch'],
    'samsung': ['galaxy', 'android'],
    'sony': ['playstation', 'headphones'],
    'microsoft': ['xbox'],
    'logitech': ['mouse', 'keyboard', 'webcam'],
    'razer': ['gaming', 'mouse', 'keyboard']
  };
  
  for (const [brand, products] of Object.entries(brands)) {
    if (queryLower.includes(brand)) {
      products.forEach(prod => expansions.add(prod));
    }
  }
  
  return Array.from(expansions);
}

/**
 * Handle product search intent (ENHANCED with flexible matching)
 */
async function handleProductSearch(query, sessionId = null) {
  console.log('[Engine] Handling product search:', query);
  
  // Extract search keywords
  const searchQuery = extractProductKeywords(query);
  console.log(`[Engine] Extracted keywords: "${searchQuery}" from "${query}"`);
  
  if (!searchQuery || searchQuery.length < 2) {
    return {
      text: "I'd be happy to help you find products! What are you looking for? You can browse our categories like Electronics, Smartphones, Laptops, Gaming, Audio, and more.",
      intent: 'product_search',
      confidence: 'medium'
    };
  }
  
  // Expand search query with aliases and related terms
  const expandedQueries = expandSearchQuery(searchQuery);
  console.log(`[Engine] Expanded search terms:`, expandedQueries);
  
  // Try each expanded query and collect all results
  let allResults = [];
  let bestResult = null;
  
  for (const expandedQuery of expandedQueries) {
    try {
      const result = await registry.execute('searchProducts', { 
        query: expandedQuery, 
        limit: 5 
      });
      
      if (result.success && result.data.count > 0) {
        // Keep track of best result (most matches)
        if (!bestResult || result.data.count > bestResult.data.count) {
          bestResult = result;
        }
        
        // Collect unique products
        result.data.products.forEach(product => {
          if (!allResults.find(p => p.id === product.id)) {
            allResults.push(product);
          }
        });
      }
    } catch (error) {
      console.error(`[Engine] Error searching for "${expandedQuery}":`, error.message);
    }
  }
  
  // No products found after trying all expansions
  if (allResults.length === 0) {
    return {
      text: `I couldn't find any products matching "${searchQuery}". Try different keywords or browse our categories: Electronics, Smartphones, Laptops, Gaming, Audio, Wearables, and Accessories. Our support team at support@shoplite.com can also help you find what you're looking for!`,
      intent: 'product_search',
      confidence: 'high',
      productsFound: false,
      searchedTerms: expandedQueries
    };
  }
  
  // Limit to top 5 most relevant results
  const topProducts = allResults.slice(0, 5);
  
  // Format product results for prompt
  const productResultsText = topProducts.map(p => `
Product: ${p.name}
Price: $${p.price.toFixed(2)}
Category: ${p.category}
${p.inStock ? `In Stock (${p.stock} available)` : 'Out of Stock'}
Description: ${p.description}
  `.trim()).join('\n\n');
  
  let responseText;
  
  try {
    // Try LLM
    const prompt = buildPrompt('product_search', query, { productResults: productResultsText }, sessionId);
    responseText = await generateResponse(prompt);
    
    if (!responseText) {
      throw new Error('LLM returned null');
    }
  } catch (error) {
    // Fallback: Simple product list
    console.log('[Engine] Using fallback response for product search');
    responseText = `I found ${topProducts.length} product${topProducts.length !== 1 ? 's' : ''} for "${searchQuery}":\n\n`;
    
    topProducts.forEach(p => {
      responseText += `• ${p.name} - $${p.price.toFixed(2)}`;
      if (!p.inStock) {
        responseText += ' (Out of Stock)';
      }
      responseText += '\n';
    });
    
    responseText += `\nVisit our store to browse more products!`;
  }
  
  return {
    text: responseText,
    intent: 'product_search',
    confidence: 'high',
    productsFound: true,
    productCount: topProducts.length,
    products: topProducts,
    searchedTerms: expandedQueries,
    functionsCalled: ['searchProducts']
  };
}
/**
 * Handle complaint intent
 */
/**
 * Handle complaint intent with empathy-first approach
 * Prioritizes emotional acknowledgment before problem-solving
 */
async function handleComplaint(query, sessionId = null) {
  console.log('[Engine] Handling complaint:', query);
  
  const queryLower = query.toLowerCase();
  
  // =========================================================================
  // STEP 1: ANALYZE COMPLAINT CHARACTERISTICS
  // =========================================================================
  
  // Detect complaint severity and type
  const isOrderRelated = /order|delivery|shipping|arrived|tracking|package|shipment|carrier/i.test(query);
  const isProductRelated = /product|item|broken|damaged|defective|not working|doesn't work|quality/i.test(query);
  const isLongComplaint = query.length > 150;
  
  // Detect emotional intensity
  const strongEmotionWords = [
    'frustrated', 'angry', 'upset', 'furious', 'livid', 'pissed',
    'terrible', 'awful', 'horrible', 'worst', 'disgusting',
    'unacceptable', 'ridiculous', 'outrageous', 'disappointed',
    'fed up', 'sick of', 'had enough'
  ];
  
  const hasStrongEmotion = strongEmotionWords.some(word => queryLower.includes(word));
  
  // Detect urgency indicators
  const urgencyWords = [
    'urgent', 'emergency', 'asap', 'immediately', 'right now',
    'still waiting', 'been waiting', 'three weeks', 'two weeks',
    'never arrived', 'still hasn\'t', 'nobody responding', 'no response'
  ];
  
  const isUrgent = urgencyWords.some(word => queryLower.includes(word));
  
  // Detect specific issues
  const hasPaymentIssue = /paid|payment|charge|charged|money|refund/i.test(query);
  const hasTimeIssue = /late|delayed|slow|taking too long|weeks ago|days ago/i.test(query);
  const hasCommunicationIssue = /nobody|no one|not responding|no response|can't reach|no reply/i.test(query);
  
  console.log(`[Engine] Complaint analysis:`, {
    isOrderRelated,
    isProductRelated,
    hasStrongEmotion,
    isUrgent,
    isLongComplaint,
    hasPaymentIssue,
    hasTimeIssue,
    hasCommunicationIssue
  });
  
  // =========================================================================
  // STEP 2: BUILD EMPATHY RESPONSE (ALWAYS FIRST)
  // =========================================================================
  
  let empathyResponse = '';
  
  if (hasStrongEmotion && isUrgent) {
    // High emotion + urgency = maximum empathy
    empathyResponse = "I'm truly sorry to hear about this extremely frustrating situation. I completely understand your frustration, and this is absolutely not the experience we want you to have. ";
  } else if (hasStrongEmotion) {
    // High emotion only
    empathyResponse = "I sincerely apologize for this frustrating experience. Your feelings are completely valid, and I'm here to help make this right. ";
  } else if (isUrgent) {
    // Urgency only
    empathyResponse = "I apologize for the delay you've experienced. I understand this is time-sensitive, and I'm here to help resolve this quickly. ";
  } else if (isLongComplaint) {
    // Long detailed complaint
    empathyResponse = "Thank you for taking the time to explain your situation. I'm sorry you've had to deal with this, and I'm here to help. ";
  } else {
    // Standard complaint
    empathyResponse = "I apologize for the inconvenience. Let me help resolve this for you. ";
  }
  
  // =========================================================================
  // STEP 3: HANDLE ORDER-RELATED COMPLAINTS
  // =========================================================================
  
  if (isOrderRelated) {
    // Try to extract order ID
    const orderId = extractOrderId(query);
    
    if (orderId) {
      console.log(`[Engine] Order ID found in complaint: ${orderId}`);
      empathyResponse += "Let me look up your order right away.\n\n";
      
      try {
        const orderResult = await registry.execute('getOrderStatus', { orderId });
        
        if (orderResult.success && orderResult.data.found) {
          const order = orderResult.data;
          const shortId = orderId.substring(Math.max(0, orderId.length - 8));
          
          empathyResponse += `I found your order (...${shortId}):\n`;
          empathyResponse += `• Status: ${order.status}\n`;
          empathyResponse += `• Total: $${order.total.toFixed(2)}\n`;
          empathyResponse += `• Ordered: ${new Date(order.createdAt).toLocaleDateString()}\n`;
          
          if (order.carrier) {
            empathyResponse += `• Carrier: ${order.carrier}\n`;
          }
          
          if (order.estimatedDelivery) {
            empathyResponse += `• Expected: ${new Date(order.estimatedDelivery).toLocaleDateString()}\n`;
          }
          
          empathyResponse += `\n`;
          
          // Provide context-specific response based on status
          if (order.status === 'PENDING' || order.status === 'PROCESSING') {
            if (hasTimeIssue) {
              empathyResponse += "I can see this order has been in processing longer than expected. ";
            }
            empathyResponse += "I'm escalating this to our fulfillment team to prioritize your order. ";
          } else if (order.status === 'SHIPPED') {
            if (hasTimeIssue) {
              empathyResponse += "I understand the shipping is taking longer than anticipated. ";
            }
            empathyResponse += "I'm notifying our shipping team to investigate the delay with the carrier. ";
          } else if (order.status === 'DELIVERED') {
            if (queryLower.includes('not received') || queryLower.includes('never arrived')) {
              empathyResponse += "Our records show this was marked as delivered, but I understand you haven't received it. This is a serious issue. ";
            }
          }
          
          // Add escalation path
          empathyResponse += `\n**Next Steps:**\n`;
          empathyResponse += `1. Our support team will contact you within 4 hours at ${order.customer.email}\n`;
          empathyResponse += `2. For immediate assistance: Call 1-800-SHOPLITE or email support@shoplite.com\n`;
          empathyResponse += `3. Reference order ID: ${shortId}\n`;
          
          if (hasPaymentIssue) {
            empathyResponse += `\nRegarding payment concerns: If a refund is needed, it will be processed within 24 hours once approved.`;
          }
          
          return {
            text: empathyResponse,
            intent: 'complaint',
            confidence: 'high',
            escalationSuggested: true,
            orderFound: true,
            orderId,
            orderData: order,
            complaintType: 'order_with_id',
            functionsCalled: ['getOrderStatus']
          };
        } else {
          // Order ID provided but not found
          console.log(`[Engine] Order ${orderId} not found`);
          empathyResponse += `I couldn't locate order ${orderId} in our system. This could mean:\n`;
          empathyResponse += `• The order ID might be slightly incorrect\n`;
          empathyResponse += `• The order might be under a different account\n\n`;
        }
      } catch (error) {
        console.error('[Engine] Error looking up order in complaint:', error);
        empathyResponse += `I encountered a technical issue looking up that order. `;
      }
    }
    
    // No order ID provided, or order lookup failed
    if (!orderId || empathyResponse.includes("couldn't locate")) {
      empathyResponse += `To help you quickly, I need your order ID. You can find it:\n`;
      empathyResponse += `• In your confirmation email\n`;
      empathyResponse += `• In the "My Orders" section of your account\n`;
      empathyResponse += `• It looks like: 67163abc4f2d9e1a3b5c8f7e\n\n`;
      
      empathyResponse += `**Immediate Help Options:**\n`;
      empathyResponse += `• Live Chat: Available 9 AM - 9 PM EST (fastest response)\n`;
      empathyResponse += `• Phone: 1-800-SHOPLITE (for urgent issues)\n`;
      empathyResponse += `• Email: support@shoplite.com (24/7, reply within 4 hours)\n`;
      
      if (isUrgent || hasStrongEmotion) {
        empathyResponse += `\nGiven the urgency, I strongly recommend calling our phone support for the fastest resolution.`;
      }
      
      return {
        text: empathyResponse,
        intent: 'complaint',
        confidence: 'high',
        needsOrderId: true,
        complaintType: 'order_without_id',
        escalationSuggested: true
      };
    }
  }
  
  // =========================================================================
  // STEP 4: HANDLE PRODUCT-RELATED COMPLAINTS
  // =========================================================================
  
  if (isProductRelated) {
    empathyResponse += `I understand you're having issues with a product. `;
    
    if (queryLower.includes('broken') || queryLower.includes('damaged') || queryLower.includes('defective')) {
      empathyResponse += `Receiving a damaged or defective product is completely unacceptable. `;
      
      // Find return policy
      const returnPolicies = findRelevantPolicies('return damaged defective product', 2);
      
      if (returnPolicies.length > 0) {
        empathyResponse += `\n\n**Your Options:**\n`;
        empathyResponse += `• Full refund (processed within 5-7 business days) [${returnPolicies[0].id}]\n`;
        empathyResponse += `• Free replacement (we cover all shipping costs)\n`;
        empathyResponse += `• Return window: 30 days from delivery\n\n`;
      }
      
      empathyResponse += `**To Process Your Return:**\n`;
      empathyResponse += `1. Go to "My Orders" in your account\n`;
      empathyResponse += `2. Select the order and click "Request Return"\n`;
      empathyResponse += `3. We'll email you a prepaid return label within 24 hours\n\n`;
      
      empathyResponse += `For immediate assistance with returns:\n`;
      empathyResponse += `• Email: returns@shoplite.com\n`;
      empathyResponse += `• Phone: 1-800-SHOPLITE (mention "damaged product" for priority)\n`;
      
      return {
        text: empathyResponse,
        intent: 'complaint',
        confidence: 'high',
        complaintType: 'product_damage',
        escalationSuggested: true,
        citations: returnPolicies.length > 0 ? [returnPolicies[0].id] : []
      };
    }
    
    // General product issue
    empathyResponse += `To help resolve this:\n`;
    empathyResponse += `• Contact support@shoplite.com with your order number\n`;
    empathyResponse += `• Include photos/videos of the issue if possible\n`;
    empathyResponse += `• Our team will respond within 4 hours with a solution\n`;
    
    return {
      text: empathyResponse,
      intent: 'complaint',
      confidence: 'high',
      complaintType: 'product_issue',
      escalationSuggested: true
    };
  }
  
  // =========================================================================
  // STEP 5: HANDLE COMMUNICATION/SUPPORT COMPLAINTS
  // =========================================================================
  
  if (hasCommunicationIssue) {
    empathyResponse += `I sincerely apologize that you haven't received a response. That's not acceptable, and I understand how frustrating that must be. `;
    
    empathyResponse += `\n\n**Let's get you immediate help:**\n`;
    empathyResponse += `• Live Chat: Click the chat icon (9 AM - 9 PM EST) - typically responds in under 2 minutes\n`;
    empathyResponse += `• Priority Phone: 1-800-SHOPLITE - mention you've been waiting for a response\n`;
    empathyResponse += `• Escalation Email: urgent@shoplite.com - for critical issues not resolved\n\n`;
    
    empathyResponse += `I'm also flagging your case internally to ensure someone follows up with you within 2 hours.`;
    
    return {
      text: empathyResponse,
      intent: 'complaint',
      confidence: 'high',
      complaintType: 'communication',
      escalationSuggested: true,
      priority: 'high'
    };
  }
  
  // =========================================================================
  // STEP 6: GENERAL COMPLAINT (Use LLM with context)
  // =========================================================================
  
  // Find relevant policies for context
  const policies = findRelevantPolicies(query + ' return refund support dispute complaint', 2);
  const policyContext = policies.length > 0 
    ? policies.map(p => `[${p.id}] ${p.question}: ${p.answer}`).join('\n\n')
    : '';
  
  let finalResponse;
  
  try {
    // Build custom complaint prompt with empathy already included
    const complaintPrompt = `${PROMPTS_CONFIG.prompt_templates.base_system_prompt}

SITUATION: Customer has a complaint or problem. You MUST be empathetic and solution-oriented.

CONTEXT:
${policyContext || 'Standard support channels available'}

CUSTOMER COMPLAINT:
"${query}"

INSTRUCTIONS:
1. The empathy acknowledgment has already been provided: "${empathyResponse}"
2. Now provide specific solutions or next steps
3. Reference relevant policies if applicable (use [PolicyID] format)
4. Keep response concise (2-3 sentences maximum)
5. Always provide a clear action the customer can take

Your response (continue after the empathy message):`;
    
    const llmResponse = await generateResponse(complaintPrompt, { maxTokens: 200 });
    
    if (llmResponse) {
      finalResponse = empathyResponse + llmResponse;
    } else {
      throw new Error('LLM returned null');
    }
  } catch (error) {
    console.log('[Engine] Using fallback response for general complaint');
    
    // Enhanced fallback with specific action items
    finalResponse = empathyResponse;
    finalResponse += `\n\n**How to Get Help:**\n`;
    finalResponse += `• Live Chat (9 AM - 9 PM EST): Fastest for most issues\n`;
    finalResponse += `• Email support@shoplite.com: We respond within 24 hours\n`;
    finalResponse += `• Call 1-800-SHOPLITE: For urgent matters\n\n`;
    
    if (policies.length > 0) {
      finalResponse += `Related policy: [${policies[0].id}] ${policies[0].question}`;
    }
  }
  
  // Validate any citations
  const citationValidation = validateCitations(finalResponse);
  
  return {
    text: finalResponse,
    intent: 'complaint',
    confidence: 'high',
    complaintType: 'general',
    escalationSuggested: true,
    citations: citationValidation.validCitations,
    invalidCitations: citationValidation.invalidCitations,
    severity: hasStrongEmotion ? 'high' : (isUrgent ? 'medium' : 'normal')
  };
}

/**
 * Handle chitchat intent (ENHANCED: Context-aware, varied responses, name recognition)
 */
async function handleChitchat(query, sessionId = null) {
  console.log('[Engine] Handling chitchat:', query);
  
  const queryLower = query.toLowerCase();
  const context = sessionId ? getContext(sessionId) : null;
  
  let responseText;
  
  // Check if this is a greeting and if user already greeted
  const isGreeting = queryLower.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)[\s!.?]*$/i);
  
  if (isGreeting) {
    if (context && context.userGreeted) {
      // User already greeted - shorter response
      const followUps = [
        "How else can I help you?",
        "What do you need assistance with?",
        "What can I do for you?",
        "How can I assist you further?"
      ];
      responseText = followUps[Math.floor(Math.random() * followUps.length)];
    } else {
      // First greeting - full introduction
      const greetings = [
        "Hello! I'm Karobot, your Shoplite support assistant. How can I help you today?",
        "Hi there! I'm Karobot from Shoplite support. What can I assist you with?",
        "Hey! I'm Karobot, here to help with your Shoplite questions. What do you need?",
        "Greetings! I'm Karobot, ready to assist with orders, products, and policies. How can I help?"
      ];
      responseText = greetings[Math.floor(Math.random() * greetings.length)];
      
      if (context) {
        context.userGreeted = true;
      }
    }
  }
  // NAME RECOGNITION - Improved
  else if (queryLower.includes('your name') || queryLower.includes('who are you') || queryLower.match(/what('s| is) your name/i)) {
    const nameResponses = [
      "I'm Karobot, your Shoplite support assistant! I'm here to help with orders, products, policies, and any questions you have. What can I do for you?",
      "My name is Karobot! I work with the Shoplite support team to help customers like you. How can I assist you today?",
      "I'm Karobot from Shoplite! I specialize in helping with orders, tracking, product questions, and store policies. What do you need help with?"
    ];
    responseText = nameResponses[Math.floor(Math.random() * nameResponses.length)];
  }
  // Are you human/robot/AI?
  else if (queryLower.match(/(are you|you a) (human|real|bot|robot|ai|artificial)/i)) {
    const identityResponses = [
      "I'm Karobot, part of the Shoplite support team! I'm here to help you with any questions about orders, products, or policies. What can I assist you with?",
      "I'm Karobot from Shoplite support! Whether you need help tracking an order or have questions about our policies, I'm here for you. How can I help?",
      "I'm here as Karobot to make your Shoplite experience better! I can help with orders, products, shipping, returns, and more. What do you need?"
    ];
    responseText = identityResponses[Math.floor(Math.random() * identityResponses.length)];
  }
  // How are you?
  else if (queryLower.match(/(how are you|how're you|how r u)/i)) {
    const wellBeingResponses = [
      "I'm doing great, thank you for asking! Ready to help you with any Shoplite questions. What do you need?",
      "I'm excellent, thanks! How can I assist you with your shopping today?",
      "I'm here and ready to help! What can I do for you at Shoplite?",
      "Doing well, thanks! What brings you here today? Orders, products, or something else?"
    ];
    responseText = wellBeingResponses[Math.floor(Math.random() * wellBeingResponses.length)];
  }
  // Thank you
  else if (queryLower.match(/(thank|thanks|thx|appreciate)/i)) {
    const gratitudeResponses = [
      "You're very welcome! Is there anything else I can help you with?",
      "Happy to help! Let me know if you need anything else.",
      "My pleasure! Feel free to ask if you have more questions.",
      "You're welcome! I'm here if you need further assistance."
    ];
    responseText = gratitudeResponses[Math.floor(Math.random() * gratitudeResponses.length)];
  }
  // Goodbye
  else if (queryLower.match(/(bye|goodbye|see you|later|gtg|got to go)/i)) {
    const farewellResponses = [
      "Goodbye! Feel free to come back if you need help. Happy shopping!",
      "Take care! Don't hesitate to reach out if you have questions later.",
      "See you later! Enjoy your Shoplite experience!",
      "Bye! Come back anytime you need assistance."
    ];
    responseText = farewellResponses[Math.floor(Math.random() * farewellResponses.length)];
  }
  // Generic chitchat - try LLM first, then fallback
  else {
    try {
      const prompt = buildPrompt('chitchat', query, {}, sessionId);
      responseText = await generateResponse(prompt, { maxTokens: 150, temperature: 0.8 });
      
      if (!responseText) {
        throw new Error('LLM returned null');
      }
    } catch (error) {
      console.log('[Engine] Using fallback response for chitchat');
      responseText = "I'm here to help with Shoplite! I can assist with orders, products, shipping policies, returns, and more. What would you like to know?";
    }
  }
  
  return {
    text: responseText,
    intent: 'chitchat',
    confidence: 'high'
  };
}

/**
 * Handle off-topic intent
 */
async function handleOffTopic(query, sessionId = null) {
  console.log('[Engine] Handling off-topic:', query);
  
  let responseText;
  
  try {
    // Try LLM
    const prompt = buildPrompt('off_topic', query, {}, sessionId);
    responseText = await generateResponse(prompt, { maxTokens: 100 });
    
    if (!responseText) {
      throw new Error('LLM returned null');
    }
  } catch (error) {
    // Fallback: Polite redirect
    console.log('[Engine] Using fallback response for off-topic');
    responseText = "I appreciate your question, but I'm specifically here to help with Shoplite shopping, orders, and product questions. Is there anything related to our store I can help you with?";
  }
  
  return {
    text: responseText,
    intent: 'off_topic',
    confidence: 'high'
  };
}

/**
 * Handle violation intent
 */
function handleViolation(query) {
  console.log('[Engine] Handling violation');
  
  return {
    text: "I'm here to help with Shoplite-related questions in a respectful manner. If you have a genuine issue or concern, I'm happy to assist. Otherwise, please reach out to support@shoplite.com.",
    intent: 'violation',
    confidence: 'high',
    flagged: true
  };
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Main assistant processing function with context
 */
async function processQuery(query, options = {}) {
  const startTime = Date.now();
  const { sessionId = null } = options;
  
  try {
    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        text: "I didn't receive a question. How can I help you today?",
        intent: 'unknown',
        confidence: 'low',
        error: 'Empty query',
        processingTime: Date.now() - startTime
      };
    }
    
    query = query.trim();
    
    // Add user message to context
    if (sessionId) {
      addToContext(sessionId, 'user', query);
    }
    
    // Classify intent
    const intentResult = await classifyIntent(query, {
      llmEndpoint: process.env.LLM_ENDPOINT,
      useLLMFallback: true
    });
    
    console.log(`[Engine] Intent: ${intentResult.intent} (confidence: ${intentResult.confidence.toFixed(2)})`);
    
    let response;
    
    // Route to appropriate handler (all now support sessionId)
    switch (intentResult.intent) {
      case 'policy_question':
        response = await handlePolicyQuestion(query, sessionId);
        break;
        
      case 'order_status':
        response = await handleOrderStatus(query, sessionId);
        break;
        
      case 'product_search':
        response = await handleProductSearch(query, sessionId);
        break;
        
      case 'complaint':
        response = await handleComplaint(query, sessionId);
        break;
        
      case 'chitchat':
        response = await handleChitchat(query, sessionId);
        break;
        
      case 'off_topic':
        response = await handleOffTopic(query, sessionId);
        break;
        
      case 'violation':
        response = handleViolation(query);
        break;
        
      default:
        response = await handleOffTopic(query, sessionId);
    }
    
    // Add assistant response to context
    if (sessionId) {
      addToContext(sessionId, 'assistant', response.text, {
        intent: response.intent,
        confidence: response.confidence
      });
    }
    
    // Add metadata
    const processingTime = Date.now() - startTime;
    
    return {
      ...response,
      query,
      processingTime,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || null,
      intentClassification: {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        method: intentResult.method
      }
    };
    
  } catch (error) {
    console.error('[Engine] Error processing query:', error);
    
    return {
      text: "I apologize, but I encountered an error processing your request. Please try again or contact our support team at support@shoplite.com.",
      intent: 'error',
      confidence: 'low',
      error: error.message,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get assistant statistics
 */
function getStats() {
  return {
    functionStats: registry.getStats(),
    configLoaded: {
      prompts: PROMPTS_CONFIG !== null,
      groundTruth: GROUND_TRUTH !== null,
      policyCount: GROUND_TRUTH ? GROUND_TRUTH.length : 0
    },
    llmConfigured: !!process.env.LLM_ENDPOINT,
    activeSessions: conversationContexts.size,
    totalContextMessages: Array.from(conversationContexts.values())
      .reduce((sum, ctx) => sum + ctx.messages.length, 0)
  };
}

/**
 * Clear session context (for testing or explicit user request)
 */
function clearSession(sessionId) {
  if (conversationContexts.has(sessionId)) {
    conversationContexts.delete(sessionId);
    return true;
  }
  return false;
}

module.exports = {
  processQuery,
  getStats,
  validateCitations,
  findRelevantPolicies,
  clearSession
};