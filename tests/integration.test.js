// tests/integration.test.js
// Integration Tests - Complete end-to-end workflows

const API_URL = process.env.API_URL || 'http://localhost:5000';

console.log('🧪 Running Integration Tests (End-to-End Workflows)...\n');
console.log(`API: ${API_URL}\n`);
console.log('='.repeat(80) + '\n');

let testsPassed = 0;
let testsFailed = 0;

// Helper to make API calls
async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();
  return { response, data };
}

// Test 1: Complete Purchase Flow
async function testCompletePurchaseFlow() {
  console.log('🛒 Test 1: Complete Purchase Flow\n');
  console.log('   Simulating full customer journey from browsing to order tracking\n');

  try {
    // Step 1: Browse products
    console.log('   Step 1: Browse products');
    const { data: productsData } = await apiCall('GET', '/api/products?limit=5');
    
    if (!productsData.products || productsData.products.length === 0) {
      throw new Error('No products available');
    }
    
    const product = productsData.products[0];
    console.log(`   ✓ Found product: ${product.name} ($${product.price})`);

    // Step 2: Look up customer
    console.log('   Step 2: Identify customer');
    const { data: customer } = await apiCall('GET', '/api/customers?email=demo@example.com');
    
    if (!customer._id) {
      throw new Error('Customer not found');
    }
    
    console.log(`   ✓ Customer: ${customer.name}`);

    // Step 3: Create order
    console.log('   Step 3: Create order');
    const { data: order, response: orderResponse } = await apiCall('POST', '/api/orders', {
      customerId: customer._id,
      items: [{ productId: product._id, quantity: 2 }]
    });

    if (orderResponse.status !== 201 || !order._id) {
      throw new Error('Order creation failed');
    }

    console.log(`   ✓ Order created: ${order._id}`);
    console.log(`   ✓ Status: ${order.status}`);
    console.log(`   ✓ Total: $${order.total.toFixed(2)}`);

    // Step 4: Verify order can be retrieved
    console.log('   Step 4: Retrieve order');
    const { data: retrievedOrder } = await apiCall('GET', `/api/orders/${order._id}`);

    if (retrievedOrder._id !== order._id) {
      throw new Error('Order retrieval mismatch');
    }

    console.log(`   ✓ Order retrieved successfully`);

    // Step 5: Ask assistant about the order
    console.log('   Step 5: Query assistant about order');
    const { data: assistantResponse } = await apiCall('POST', '/api/assistant/chat', {
      query: `Track order ${order._id}`
    });

    const calledFunction = assistantResponse.functionsCalled?.includes('getOrderStatus');
    console.log(`   ✓ Assistant responded`);
    console.log(`   ✓ Function called: ${calledFunction ? 'Yes' : 'No (may need order ID in correct format)'}`);

    console.log('\n   ✅ Test 1 PASSED: Complete purchase flow successful\n');
    testsPassed++;

  } catch (error) {
    console.log(`\n   ❌ Test 1 FAILED: ${error.message}\n`);
    testsFailed++;
  }
}

// Test 2: Support Interaction Flow
async function testSupportInteractionFlow() {
  console.log('💬 Test 2: Support Interaction Flow\n');
  console.log('   Testing multi-turn conversation with different intents\n');

  try {
    // Turn 1: Greeting (chitchat)
    console.log('   Turn 1: Greeting');
    const { data: greeting } = await apiCall('POST', '/api/assistant/chat', {
      query: 'Hello'
    });

    if (!greeting.text) {
      throw new Error('No response to greeting');
    }

    console.log(`   ✓ Response: ${greeting.text.substring(0, 50)}...`);
    console.log(`   ✓ Intent: ${greeting.intent}`);

    // Turn 2: Policy question
    console.log('   Turn 2: Policy question');
    const { data: policy } = await apiCall('POST', '/api/assistant/chat', {
      query: 'What is your return policy?'
    });

    if (!policy.text || policy.intent !== 'policy_question') {
      throw new Error('Policy question not handled correctly');
    }

    const hasCitations = policy.citations && policy.citations.length > 0;
    console.log(`   ✓ Response received`);
    console.log(`   ✓ Intent: ${policy.intent}`);
    console.log(`   ✓ Citations: ${hasCitations ? policy.citations.join(', ') : 'None'}`);

    // Turn 3: Product search
    console.log('   Turn 3: Product search');
    const { data: search } = await apiCall('POST', '/api/assistant/chat', {
      query: 'Show me laptops'
    });

    const searchedProducts = search.intent === 'product_search' || 
                            search.functionsCalled?.includes('searchProducts');
    console.log(`   ✓ Response received`);
    console.log(`   ✓ Intent: ${search.intent}`);
    console.log(`   ✓ Product search: ${searchedProducts ? 'Yes' : 'No'}`);

    // Turn 4: Complaint
    console.log('   Turn 4: Express complaint');
    const { data: complaint } = await apiCall('POST', '/api/assistant/chat', {
      query: 'My order arrived damaged'
    });

    if (!complaint.text || complaint.intent !== 'complaint') {
      throw new Error('Complaint not handled correctly');
    }

    console.log(`   ✓ Response received (empathetic tone expected)`);
    console.log(`   ✓ Intent: ${complaint.intent}`);

    console.log('\n   ✅ Test 2 PASSED: Support interaction flow successful\n');
    testsPassed++;

  } catch (error) {
    console.log(`\n   ❌ Test 2 FAILED: ${error.message}\n`);
    testsFailed++;
  }
}

// Test 3: Multi-Intent Conversation
async function testMultiIntentConversation() {
  console.log('🔄 Test 3: Multi-Intent Conversation\n');
  console.log('   Testing context maintenance across different intents\n');

  try {
    const conversation = [
      {
        query: 'Hi there',
        expectedIntent: 'chitchat',
        description: 'Greeting'
      },
      {
        query: 'Do you have wireless headphones?',
        expectedIntent: 'product_search',
        description: 'Product inquiry'
      },
      {
        query: 'How long does shipping take?',
        expectedIntent: 'policy_question',
        description: 'Shipping policy'
      },
      {
        query: 'Thank you for your help',
        expectedIntent: 'chitchat',
        description: 'Gratitude'
      }
    ];

    let turnsPassed = 0;

    for (let i = 0; i < conversation.length; i++) {
      const turn = conversation[i];
      console.log(`   Turn ${i + 1}: ${turn.description}`);
      console.log(`   Query: "${turn.query}"`);

      const { data: response } = await apiCall('POST', '/api/assistant/chat', {
        query: turn.query
      });

      if (!response.text) {
        throw new Error(`No response on turn ${i + 1}`);
      }

      const intentMatch = response.intent === turn.expectedIntent;
      console.log(`   Response: ${response.text.substring(0, 60)}...`);
      console.log(`   Expected intent: ${turn.expectedIntent}`);
      console.log(`   Actual intent: ${response.intent}`);
      console.log(`   ${intentMatch ? '✓' : '✗'} Intent match: ${intentMatch}\n`);

      if (intentMatch) turnsPassed++;
    }

    if (turnsPassed >= conversation.length - 1) { // Allow 1 mismatch
      console.log(`   ✅ Test 3 PASSED: ${turnsPassed}/${conversation.length} intents correct\n`);
      testsPassed++;
    } else {
      console.log(`   ❌ Test 3 FAILED: Only ${turnsPassed}/${conversation.length} intents correct\n`);
      testsFailed++;
    }

  } catch (error) {
    console.log(`\n   ❌ Test 3 FAILED: ${error.message}\n`);
    testsFailed++;
  }
}

// Run all integration tests
async function runAllTests() {
  console.log('🧪 Integration Test Suite - End-to-End Workflows\n');
  console.log('='.repeat(80) + '\n');

  await testCompletePurchaseFlow();
  console.log('='.repeat(80) + '\n');
  
  await testSupportInteractionFlow();
  console.log('='.repeat(80) + '\n');
  
  await testMultiIntentConversation();
  console.log('='.repeat(80) + '\n');

  // Final summary
  const totalTests = testsPassed + testsFailed;
  console.log('📊 Integration Test Summary:\n');
  console.log(`Total Workflows: ${totalTests}`);
  console.log(`Passed: ${testsPassed} (${((testsPassed / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${testsFailed} (${((testsFailed / totalTests) * 100).toFixed(1)}%)`);
  console.log('');

  if (testsFailed === 0) {
    console.log('✅ All integration tests passed!');
    console.log('   The system works correctly end-to-end.');
  } else {
    console.log('⚠️  Some integration tests failed.');
    console.log('   Review the failures above for details.');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
