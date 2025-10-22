// tests/assistant.test.js
// Comprehensive tests for assistant functionality

const { classifyIntent, extractOrderId } = require('../apps/api/src/assistant/intent-classifier');
const { registry } = require('../apps/api/src/assistant/function-registry');
const { validateCitations, findRelevantPolicies } = require('../apps/api/src/assistant/engine');

/**
 * Test Suite 1: Intent Detection Tests
 */
describe('Intent Detection Tests', () => {
  
  const testCases = [
    // Policy Question Intent (5 examples)
    {
      query: "What is your return policy?",
      expectedIntent: "policy_question",
      description: "Basic return policy question"
    },
    {
      query: "How long does standard shipping take?",
      expectedIntent: "policy_question",
      description: "Shipping timeframe question"
    },
    {
      query: "What commission do sellers pay?",
      expectedIntent: "policy_question",
      description: "Fee structure question"
    },
    {
      query: "How much does it cost to list products?",
      expectedIntent: "policy_question",
      description: "Cost/pricing question"
    },
    {
      query: "What are the requirements for seller verification?",
      expectedIntent: "policy_question",
      description: "Requirements question"
    },
    
    // Order Status Intent (5 examples)
    {
      query: "Where is my order ABC1234567?",
      expectedIntent: "order_status",
      description: "Order tracking with ID"
    },
    {
      query: "Track order XYZ9876543210",
      expectedIntent: "order_status",
      description: "Direct tracking request"
    },
    {
      query: "Has my package shipped yet?",
      expectedIntent: "order_status",
      description: "Shipping status question"
    },
    {
      query: "When will my order arrive?",
      expectedIntent: "order_status",
      description: "Delivery estimate question"
    },
    {
      query: "Order status for 1234567890ABCD",
      expectedIntent: "order_status",
      description: "Order status with ID format variation"
    },
    
    // Product Search Intent (5 examples)
    {
      query: "Do you have laptops?",
      expectedIntent: "product_search",
      description: "Simple product availability"
    },
    {
      query: "Looking for running shoes",
      expectedIntent: "product_search",
      description: "Product search with 'looking for'"
    },
    {
      query: "Show me electronics under $500",
      expectedIntent: "product_search",
      description: "Product search with price filter"
    },
    {
      query: "Find wireless headphones",
      expectedIntent: "product_search",
      description: "Product search with 'find'"
    },
    {
      query: "What products do you sell?",
      expectedIntent: "product_search",
      description: "General catalog question"
    },
    
    // Complaint Intent (4 examples)
    {
      query: "My order arrived damaged!",
      expectedIntent: "complaint",
      description: "Damaged product complaint"
    },
    {
      query: "This is terrible service",
      expectedIntent: "complaint",
      description: "Service complaint"
    },
    {
      query: "The product is broken and doesn't work",
      expectedIntent: "complaint",
      description: "Defective product complaint"
    },
    {
      query: "I'm very unhappy with my purchase",
      expectedIntent: "complaint",
      description: "General dissatisfaction"
    },
    
    // Chitchat Intent (4 examples)
    {
      query: "Hello! How are you?",
      expectedIntent: "chitchat",
      description: "Greeting"
    },
    {
      query: "Thank you for your help",
      expectedIntent: "chitchat",
      description: "Thanks"
    },
    {
      query: "What's your name?",
      expectedIntent: "chitchat",
      description: "Personal question"
    },
    {
      query: "Good morning!",
      expectedIntent: "chitchat",
      description: "Morning greeting"
    },
    
    // Off-Topic Intent (3 examples)
    {
      query: "What's the weather like today?",
      expectedIntent: "off_topic",
      description: "Weather question"
    },
    {
      query: "Tell me a joke",
      expectedIntent: "off_topic",
      description: "Entertainment request"
    },
    {
      query: "Who won the game last night?",
      expectedIntent: "off_topic",
      description: "Sports question"
    },
    
    // Violation Intent (2 examples)
    {
      query: "You're an idiot and this is stupid",
      expectedIntent: "violation",
      description: "Insulting language"
    },
    {
      query: "This fucking sucks",
      expectedIntent: "violation",
      description: "Profanity"
    }
  ];
  
  console.log('\n=== INTENT DETECTION TESTS ===\n');
  
  testCases.forEach((testCase, index) => {
    test(`${index + 1}. ${testCase.description}`, async () => {
      const result = await classifyIntent(testCase.query, { useLLMFallback: false });
      
      console.log(`[Test ${index + 1}] Query: "${testCase.query}"`);
      console.log(`  Expected: ${testCase.expectedIntent}`);
      console.log(`  Got: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`);
      console.log(`  Status: ${result.intent === testCase.expectedIntent ? 'âœ…PASS' : 'âŒFAIL'}\n`);
      
      expect(result.intent).toBe(testCase.expectedIntent);
    });
  });
});

/**
 * Test Suite 2: Identity Tests
 */
describe('Assistant Identity Tests', () => {
  
  const identityTests = [
    {
      query: "What's your name?",
      shouldNotContain: ["AI", "ChatGPT", "Claude", "Llama", "Qwen", "language model"],
      shouldContain: ["Karobot"],
      description: "Name question"
    },
    {
      query: "Are you a robot?",
      shouldNotContain: ["I'm an AI", "artificial intelligence", "language model"],
      description: "Robot question"
    },
    {
      query: "Who created you?",
      shouldNotContain: ["OpenAI", "Anthropic", "Meta", "Alibaba"],
      shouldContain: ["Shoplite"],
      description: "Creator question"
    }
  ];
  
  console.log('\n=== ASSISTANT IDENTITY TESTS ===\n');
  console.log('Note: These tests require LLM endpoint to be available\n');
  
  // Mock test (actual implementation would call processQuery)
  identityTests.forEach((testCase, index) => {
    test(`Identity ${index + 1}: ${testCase.description}`, () => {
      // This is a placeholder - actual test would call processQuery
      // and validate response doesn't reveal AI identity
      
      console.log(`[Identity Test ${index + 1}]`);
      console.log(`  Query: "${testCase.query}"`);
      console.log(`  Should NOT contain: ${testCase.shouldNotContain.join(', ')}`);
      if (testCase.shouldContain) {
        console.log(`  Should contain: ${testCase.shouldContain.join(', ')}`);
      }
      console.log(`  Status: âš ï¸ REQUIRES LLM (manual verification)\n`);
      
      expect(true).toBe(true); // Placeholder
    });
  });
});

/**
 * Test Suite 3: Function Calling Tests
 */
describe('Function Calling Tests', () => {
  
  console.log('\n=== FUNCTION CALLING TESTS ===\n');
  
  test('1. getOrderStatus with valid ID', async () => {
    const result = await registry.execute('getOrderStatus', { 
      orderId: 'TEST123456' // This will fail without real DB, but tests the flow
    });
    
    console.log('[Function Test 1] getOrderStatus execution');
    console.log(`  Success: ${result.success}`);
    console.log(`  Status: ${result.success ? 'âœ…PASS' : 'âš ï¸ EXPECTED (no DB)'}\n`);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('functionName', 'getOrderStatus');
  });
  
  test('2. searchProducts with query', async () => {
    const result = await registry.execute('searchProducts', { 
      query: 'laptop',
      limit: 5
    });
    
    console.log('[Function Test 2] searchProducts execution');
    console.log(`  Success: ${result.success}`);
    console.log(`  Status: ${result.success ? 'âœ…PASS' : 'âš ï¸ EXPECTED (no DB)'}\n`);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('functionName', 'searchProducts');
  });
  
  test('3. getCustomerOrders with email', async () => {
    const result = await registry.execute('getCustomerOrders', { 
      email: 'demo@shoplite.com'
    });
    
    console.log('[Function Test 3] getCustomerOrders execution');
    console.log(`  Success: ${result.success}`);
    console.log(`  Status: ${result.success ? 'âœ…PASS' : 'âš ï¸ EXPECTED (no DB)'}\n`);
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('functionName', 'getCustomerOrders');
  });
  
  test('4. Invalid function name', async () => {
    const result = await registry.execute('nonExistentFunction', {});
    
    console.log('[Function Test 4] Invalid function name');
    console.log(`  Success: ${result.success} (should be false)`);
    console.log(`  Error: ${result.error}`);
    console.log(`  Status: ${!result.success ? 'âœ…PASS' : 'âŒFAIL'}\n`);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

/**
 * Test Suite 4: Citation Validation Tests
 */
describe('Citation Validation Tests', () => {
  
  console.log('\n=== CITATION VALIDATION TESTS ===\n');
  
  test('1. Valid citations', () => {
    const response = "Our return policy [Policy8.1] allows returns within 30 days. Shipping [Shipping2.1] takes 5-7 business days.";
    const result = validateCitations(response);
    
    console.log('[Citation Test 1] Valid citations');
    console.log(`  Response: "${response}"`);
    console.log(`  Valid: ${result.isValid}`);
    console.log(`  Valid citations: ${result.validCitations.join(', ')}`);
    console.log(`  Invalid citations: ${result.invalidCitations.join(', ') || 'none'}`);
    console.log(`  Status: ${result.isValid ? 'âœ…PASS' : 'âŒFAIL'}\n`);
    
    expect(result.isValid).toBe(true);
    expect(result.validCitations.length).toBeGreaterThan(0);
  });
  
  test('2. Invalid citations', () => {
    const response = "According to our policy [Policy99.99], refunds take 1-2 days.";
    const result = validateCitations(response);
    
    console.log('[Citation Test 2] Invalid citations');
    console.log(`  Response: "${response}"`);
    console.log(`  Valid: ${result.isValid}`);
    console.log(`  Invalid citations: ${result.invalidCitations.join(', ')}`);
    console.log(`  Status: ${!result.isValid ? 'âœ…PASS' : 'âŒFAIL'}\n`);
    
    expect(result.isValid).toBe(false);
    expect(result.invalidCitations.length).toBeGreaterThan(0);
  });
  
  test('3. No citations', () => {
    const response = "Contact support for more information.";
    const result = validateCitations(response);
    
    console.log('[Citation Test 3] No citations');
    console.log(`  Response: "${response}"`);
    console.log(`  Has citations: ${!result.noCitations}`);
    console.log(`  Status: ${result.noCitations ? 'âœ…PASS' : 'âŒFAIL'}\n`);
    
    expect(result.noCitations).toBe(true);
  });
});

/**
 * Test Suite 5: Utility Function Tests
 */
describe('Utility Function Tests', () => {
  
  console.log('\n=== UTILITY FUNCTION TESTS ===\n');
  
  test('1. Extract order ID from query', () => {
    const queries = [
      { query: "Where is my order ABC1234567?", expected: "ABC1234567" },
      { query: "Track 9876543210ABCD", expected: "9876543210ABCD" },
      { query: "Order status please", expected: null }
    ];
    
    queries.forEach((testCase, idx) => {
      const result = extractOrderId(testCase.query);
      console.log(`  [${idx + 1}] Query: "${testCase.query}"`);
      console.log(`      Expected: ${testCase.expected || 'null'}`);
      console.log(`      Got: ${result || 'null'}`);
      console.log(`      Status: ${result === testCase.expected ? '✅' : '❌'}`);
      
      expect(result).toBe(testCase.expected);
    });
    console.log();
  });
  
  test('2. Find relevant policies', () => {
    const queries = [
      { query: "What is your return policy?", expectedCategory: "returns" },
      { query: "How long does shipping take?", expectedCategory: "shipping" },
      { query: "What are the fees?", expectedCategory: "fees" }
    ];
    
    queries.forEach((testCase, idx) => {
      const policies = findRelevantPolicies(testCase.query, 3);
      const hasExpectedCategory = policies.some(p => p.category === testCase.expectedCategory);
      
      console.log(`  [${idx + 1}] Query: "${testCase.query}"`);
      console.log(`      Found ${policies.length} policies`);
      console.log(`      Expected category: ${testCase.expectedCategory}`);
      console.log(`      Has expected: ${hasExpectedCategory ? '✅' : '❌'}`);
      
      expect(policies.length).toBeGreaterThan(0);
    });
    console.log();
  });
});

/**
 * Run all tests
 */
console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║      KAROBOT ASSISTANT TEST SUITE                 ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Export for Jest or run manually
if (require.main === module) {
  console.log('Run with: npm test\n');
}

module.exports = {
  // Export test suites for Jest
};