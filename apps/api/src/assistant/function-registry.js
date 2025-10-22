// function-registry.js
// Extensible function registry with enhanced order lookup

const { Order, Product, Customer } = require('../db');
const { ObjectId } = require('mongodb');

/**
 * Function Registry Class
 * Manages available functions and their execution
 */
class FunctionRegistry {
  constructor() {
    this.functions = new Map();
    this.registerBuiltInFunctions();
  }
  
  /**
   * Register a function in the registry
   */
  register(name, handler, schema) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${name} must be a function`);
    }
    
    this.functions.set(name, {
      name,
      handler,
      schema,
      callCount: 0,
      lastCalled: null,
      errors: 0
    });
    
    console.log(`[Registry] Registered function: ${name}`);
  }
  
  /**
   * Get all function schemas
   */
  getAllSchemas() {
    const schemas = [];
    for (const [name, config] of this.functions) {
      schemas.push({
        name,
        ...config.schema
      });
    }
    return schemas;
  }
  
  /**
   * Execute a function by name
   */
  async execute(name, params = {}) {
    const func = this.functions.get(name);
    
    if (!func) {
      return {
        success: false,
        error: `Function '${name}' not found`,
        availableFunctions: Array.from(this.functions.keys())
      };
    }
    
    try {
      // Update call stats
      func.callCount++;
      func.lastCalled = new Date();
      
      console.log(`[Registry] Executing ${name} with params:`, params);
      
      // Execute handler
      const startTime = Date.now();
      const result = await func.handler(params);
      const executionTime = Date.now() - startTime;
      
      console.log(`[Registry] ${name} completed in ${executionTime}ms`);
      
      return {
        success: true,
        data: result,
        functionName: name,
        executionTime
      };
      
    } catch (error) {
      func.errors++;
      console.error(`[Registry] Error executing ${name}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        functionName: name
      };
    }
  }
  
  /**
   * Get function statistics
   */
  getStats() {
    const stats = {};
    for (const [name, config] of this.functions) {
      stats[name] = {
        callCount: config.callCount,
        lastCalled: config.lastCalled,
        errors: config.errors,
        successRate: config.callCount > 0 
          ? ((config.callCount - config.errors) / config.callCount * 100).toFixed(2) + '%'
          : 'N/A'
      };
    }
    return stats;
  }
  
  /**
   * Register built-in functions
   */
  registerBuiltInFunctions() {
    // Function 1: Get Order Status (ENHANCED)
    this.register(
      'getOrderStatus',
      this.getOrderStatusHandler,
      {
        description: 'Retrieve current status and details of a customer order',
        parameters: {
          orderId: {
            type: 'string',
            required: true,
            pattern: '[A-Z0-9]{6,}',
            description: 'Order identifier (full ObjectId, last 8+ chars, or tracking number)'
          }
        },
        returns: {
          status: 'Order status (PENDING | PROCESSING | SHIPPED | DELIVERED)',
          items: 'Array of order items',
          total: 'Order total amount',
          trackingNumber: 'Carrier tracking number (if shipped)',
          carrier: 'Shipping carrier name',
          estimatedDelivery: 'Estimated delivery date',
          createdAt: 'Order creation date'
        }
      }
    );
    
    // Function 2: Search Products
    this.register(
      'searchProducts',
      this.searchProductsHandler,
      {
        description: 'Search product catalog by query and filters',
        parameters: {
          query: {
            type: 'string',
            required: true,
            description: 'Search keywords'
          },
          limit: {
            type: 'number',
            required: false,
            default: 5,
            description: 'Maximum results to return'
          },
          category: {
            type: 'string',
            required: false,
            description: 'Filter by category'
          }
        },
        returns: {
          products: 'Array of matching products with name, price, category, stock'
        }
      }
    );
    
    // Function 3: Get Customer Orders
    this.register(
      'getCustomerOrders',
      this.getCustomerOrdersHandler,
      {
        description: 'Retrieve all orders for a specific customer',
        parameters: {
          email: {
            type: 'string',
            required: true,
            description: 'Customer email address'
          },
          limit: {
            type: 'number',
            required: false,
            default: 10,
            description: 'Maximum orders to return'
          }
        },
        returns: {
          orders: 'Array of customer orders with status and details',
          customer: 'Customer information'
        }
      }
    );
  }
  
  /**
   * Handler: Get Order Status (ENHANCED - Multiple lookup strategies)
   */
  async getOrderStatusHandler(params) {
    const { orderId } = params;
    
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('orderId is required and must be a string');
    }
    
    const cleanId = orderId.trim();
    console.log(`[Registry] Looking up order with ID: "${cleanId}"`);
    
    let order = null;
    let lookupMethod = 'none';
    
    // STRATEGY 1: Full MongoDB ObjectId (24 hex characters)
    if (ObjectId.isValid(cleanId) && cleanId.length === 24) {
      console.log('[Registry] Trying full ObjectId lookup...');
      try {
        order = await Order.findById(cleanId)
          .populate('customerId', 'name email')
          .populate('items.productId', 'name price');
        
        if (order) {
          lookupMethod = 'full_objectid';
          console.log('[Registry] ✓ Found by full ObjectId');
        }
      } catch (error) {
        console.log('[Registry] ✗ Full ObjectId lookup failed:', error.message);
      }
    }
    
    // STRATEGY 2: Tracking number or order reference
    if (!order && cleanId.length >= 6) {
      console.log('[Registry] Trying tracking number/reference lookup...');
      try {
        order = await Order.findOne({
          $or: [
            { trackingNumber: cleanId },
            { trackingNumber: { $regex: cleanId, $options: 'i' } },
            { orderReference: cleanId },
            { orderReference: { $regex: cleanId, $options: 'i' } }
          ]
        })
        .populate('customerId', 'name email')
        .populate('items.productId', 'name price');
        
        if (order) {
          lookupMethod = 'tracking_or_reference';
          console.log('[Registry] ✓ Found by tracking number/reference');
        }
      } catch (error) {
        console.log('[Registry] ✗ Tracking lookup failed:', error.message);
      }
    }
    
    // STRATEGY 3: Partial ObjectId match (last 8+ characters)
    if (!order && cleanId.length >= 6 && /^[a-f0-9]+$/i.test(cleanId)) {
      console.log('[Registry] Trying partial ObjectId match...');
      try {
        // Get recent orders (last 100) to search through
        const recentOrders = await Order.find({})
          .sort({ createdAt: -1 })
          .limit(100)
          .populate('customerId', 'name email')
          .populate('items.productId', 'name price');
        
        // Find order where ObjectId ends with or contains the provided ID
        const cleanIdLower = cleanId.toLowerCase();
        order = recentOrders.find(o => {
          const fullId = o._id.toString().toLowerCase();
          return fullId.endsWith(cleanIdLower) || 
                 (cleanId.length >= 8 && fullId.includes(cleanIdLower));
        });
        
        if (order) {
          lookupMethod = 'partial_objectid';
          console.log('[Registry] ✓ Found by partial ObjectId match');
        }
      } catch (error) {
        console.log('[Registry] ✗ Partial match failed:', error.message);
      }
    }
    
    // STRATEGY 4: Case-insensitive search in _id as string (last resort)
    if (!order && cleanId.length >= 8) {
      console.log('[Registry] Trying case-insensitive string search...');
      try {
        const allOrders = await Order.find({})
          .limit(200)
          .populate('customerId', 'name email')
          .populate('items.productId', 'name price');
        
        order = allOrders.find(o => 
          o._id.toString().toLowerCase().includes(cleanId.toLowerCase())
        );
        
        if (order) {
          lookupMethod = 'fuzzy_search';
          console.log('[Registry] ✓ Found by fuzzy search');
        }
      } catch (error) {
        console.log('[Registry] ✗ Fuzzy search failed:', error.message);
      }
    }
    
    // Order not found
    if (!order) {
      console.log('[Registry] ✗ Order not found after all strategies');
      return {
        found: false,
        searchedId: cleanId,
        message: `Order ${cleanId} not found. Please verify the order ID from your confirmation email.`,
        lookupAttempts: ['full_objectid', 'tracking', 'partial_match', 'fuzzy_search']
      };
    }
    
    // Order found - return details
    console.log(`[Registry] ✓ Order found via ${lookupMethod}: ${order._id}`);
    
    return {
      found: true,
      orderId: order._id.toString(),
      status: order.status,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: order.total,
      customer: {
        name: order.customerId?.name || 'N/A',
        email: order.customerId?.email || 'N/A'
      },
      carrier: order.carrier || null,
      trackingNumber: order.trackingNumber || null,
      estimatedDelivery: order.estimatedDelivery || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      lookupMethod // For debugging
    };
  }
  
  /**
   * Handler: Search Products
   */
  /**
 * Handler: Search Products (ENHANCED with flexible matching)
 */
async searchProductsHandler(params) {
  const { query, limit = 5, category } = params;
  
  if (!query) {
    throw new Error('query is required');
  }
  
  const queryLower = query.toLowerCase();
  console.log(`[Registry] Searching products for: "${query}"`);
  
  // Build flexible search filter with multiple strategies
  const searchConditions = [];
  
  // Strategy 1: Exact and partial name matches
  searchConditions.push(
    { name: { $regex: query, $options: 'i' } }
  );
  
  // Strategy 2: Description matches
  searchConditions.push(
    { description: { $regex: query, $options: 'i' } }
  );
  
  // Strategy 3: Tag matches (array search)
  searchConditions.push(
    { tags: { $elemMatch: { $regex: query, $options: 'i' } } }
  );
  
  // Strategy 4: Category matches
  searchConditions.push(
    { category: { $regex: query, $options: 'i' } }
  );
  
  // Combine all strategies with $or
  const searchFilter = {
    $or: searchConditions
  };
  
  // Add category filter if provided
  if (category) {
    searchFilter.category = { $regex: category, $options: 'i' };
  }
  
  console.log('[Registry] Search filter:', JSON.stringify(searchFilter, null, 2));
  
  // Search products
  const products = await Product.find(searchFilter)
    .limit(limit * 2) // Get more results for ranking
    .select('name description price category stock imageUrl tags');
  
  // Rank results by relevance
  const rankedProducts = products.map(product => {
    let relevanceScore = 0;
    const nameLower = product.name.toLowerCase();
    const descLower = product.description?.toLowerCase() || '';
    const categoryLower = product.category.toLowerCase();
    const tagsLower = product.tags.map(t => t.toLowerCase());
    
    // Exact name match = highest score
    if (nameLower === queryLower) {
      relevanceScore += 100;
    }
    // Name starts with query
    else if (nameLower.startsWith(queryLower)) {
      relevanceScore += 50;
    }
    // Name contains query
    else if (nameLower.includes(queryLower)) {
      relevanceScore += 30;
    }
    
    // Category exact match
    if (categoryLower === queryLower) {
      relevanceScore += 40;
    }
    // Category contains query
    else if (categoryLower.includes(queryLower)) {
      relevanceScore += 20;
    }
    
    // Tag exact match
    if (tagsLower.includes(queryLower)) {
      relevanceScore += 35;
    }
    // Tag contains query
    else if (tagsLower.some(tag => tag.includes(queryLower))) {
      relevanceScore += 15;
    }
    
    // Description match (lower priority)
    if (descLower.includes(queryLower)) {
      relevanceScore += 10;
    }
    
    // Boost if in stock
    if (product.stock > 0) {
      relevanceScore += 5;
    }
    
    return {
      product,
      relevanceScore
    };
  });
  
  // Sort by relevance and take top results
  rankedProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topProducts = rankedProducts.slice(0, limit);
  
  console.log(`[Registry] Found ${products.length} products, returning top ${topProducts.length}`);
  if (topProducts.length > 0) {
    console.log(`[Registry] Top result: ${topProducts[0].product.name} (score: ${topProducts[0].relevanceScore})`);
  }
  
  return {
    query,
    count: topProducts.length,
    totalFound: products.length,
    products: topProducts.map(({ product: p, relevanceScore }) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description ? p.description.substring(0, 150) + '...' : '',
      price: p.price,
      category: p.category,
      stock: p.stock,
      inStock: p.stock > 0,
      imageUrl: p.imageUrl,
      tags: p.tags,
      relevanceScore // For debugging
    }))
  };
}
  
  /**
   * Handler: Get Customer Orders
   */
  async getCustomerOrdersHandler(params) {
    const { email, limit = 10 } = params;
    
    if (!email) {
      throw new Error('email is required');
    }
    
    // Find customer by email
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return {
        found: false,
        message: `No customer found with email ${email}`
      };
    }
    
    // Find customer orders
    const orders = await Order.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id status total items createdAt estimatedDelivery carrier');
    
    return {
      found: true,
      customer: {
        name: customer.name,
        email: customer.email
      },
      orderCount: orders.length,
      orders: orders.map(o => ({
        orderId: o._id.toString(),
        status: o.status,
        total: o.total,
        itemCount: o.items.length,
        createdAt: o.createdAt,
        estimatedDelivery: o.estimatedDelivery,
        carrier: o.carrier
      }))
    };
  }
}

// Create singleton instance
const registry = new FunctionRegistry();

module.exports = {
  FunctionRegistry,
  registry
};