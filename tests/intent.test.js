// tests/intent.test.js
// Intent Detection Tests - Test all 7 intents with 3-5 examples each

const { classifyIntent } = require('../src/assistant/intent-classifier');

console.log('🧪 Running Intent Detection Tests...\n');

// Test data: 3-5 examples per intent
const testCases = [
  // 1. POLICY_QUESTION (5 examples)
  {
    query: 'What is your return policy?',
    expectedIntent: 'policy_question',
    description: 'Direct policy question'
  },
  {
    query: 'How long does shipping take?',
    expectedIntent: 'policy_question',
    description: 'Shipping timeframe question'
  },
  {
    query: 'Do you offer warranty on products?',
    expectedIntent: 'policy_question',
    description: 'Warranty inquiry'
  },
  {
    query: 'What are the return requirements?',
    expectedIntent: 'policy_question',
    description: 'Return requirements'
  },
  {
    query: 'How much is the shipping cost?',
    expectedIntent: 'policy_question',
    description: 'Shipping cost question'
  },

  // 2. ORDER_STATUS (5 examples)
  {
    query: 'Where is my order ABC1234567890?',
    expectedIntent: 'order_status',
    description: 'Order tracking with ID'
  },
  {
    query: 'Track my order',
    expectedIntent: 'order_status',
    description: 'Generic tracking request'
  },
  {
    query: 'Has my package shipped yet?',
    expectedIntent: 'order_status',
    description: 'Shipping status inquiry'
  },
  {
    query: 'When will my order arrive?',
    expectedIntent: 'order_status',
    description: 'Delivery timeframe'
  },
  {
    query: 'Check status of order XYZ9876543210',
    expectedIntent: 'order_status',
    description: 'Status check with order ID'
  },

  // 3. PRODUCT_SEARCH (5 examples)
  {
    query: 'Do you have laptops?',
    expectedIntent: 'product_search',
    description: 'Product availability question'
  },
  {
    query: 'Show me wireless headphones',
    expectedIntent: 'product_search',
    description: 'Product search request'
  },
  {
    query: 'Looking for gaming keyboards',
    expectedIntent: 'product_search',
    description: 'Product lookup'
  },
  {
    query: 'Find me a smartphone under $500',
    expectedIntent: 'product_search',
    description: 'Product search with criteria'
  },
  {
    query: 'Where can I find monitors?',
    expectedIntent: 'product_search',
    description: 'Product location inquiry'
  },

  // 4. COMPLAINT (5 examples)
  {
    query: 'My order arrived damaged',
    expectedIntent: 'complaint',
    description: 'Damaged product complaint'
  },
  {
    query: 'This product is not working properly',
    expectedIntent: 'complaint',
    description: 'Product defect complaint'
  },
  {
    query: 'I am very disappointed with the quality',
    expectedIntent: 'complaint',
    description: 'Quality complaint'
  },
  {
    query: 'The item I received is broken',
    expectedIntent: 'complaint',
    description: 'Broken item complaint'
  },
  {
    query: 'This is terrible service, I want a refund',
    expectedIntent: 'complaint',
    description: 'Service complaint with refund request'
  },

  // 5. CHITCHAT (5 examples)
  {
    query: 'Hello',
    expectedIntent: 'chitchat',
    description: 'Simple greeting'
  },
  {
    query: 'Good morning, how are you?',
    expectedIntent: 'chitchat',
    description: 'Morning greeting with question'
  },
  {
    query: 'Thank you for your help',
    expectedIntent: 'chitchat',
    description: 'Gratitude expression'
  },
  {
    query: 'What is your name?',
    expectedIntent: 'chitchat',
    description: 'Identity question'
  },
  {
    query: 'Goodbye',
    expectedIntent: 'chitchat',
    description: 'Farewell'
  },

  // 6. OFF_TOPIC (4 examples)
  {
    query: 'What is the weather today?',
    expectedIntent: 'off_topic',
    description: 'Weather question'
  },
  {
    query: 'Tell me a joke',
    expectedIntent: 'off_topic',
    description: 'Entertainment request'
  },
  {
    query: 'Who won the game last night?',
    expectedIntent: 'off_topic',
    description: 'Sports question'
  },
  {
    query: 'What are the latest news headlines?',
    expectedIntent: 'off_topic',
    description: 'News inquiry'
  },

  // 7. VIOLATION (3 examples)
  {
    query: 'You are stupid',
    expectedIntent: 'violation',
    description: 'Insult'
  },
  {
    query: 'This is fucking ridiculous',
    expectedIntent: 'violation',
    description: 'Profanity'
  },
  {
    query: 'I hate this damn service',
    expectedIntent: 'violation',
    description: 'Profanity with complaint'
  }
];

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  console.log('Testing Intent Classification (Keyword-based):\n');
  console.log('='.repeat(80) + '\n');

  for (const testCase of testCases) {
    const result = await classifyIntent(testCase.query, {
      useLLMFallback: false // Test keyword matching only
    });

    const isCorrect = result.intent === testCase.expectedIntent;
    
    if (isCorrect) {
      passed++;
      console.log(`✅ PASS: ${testCase.description}`);
    } else {
      failed++;
      console.log(`❌ FAIL: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Expected: ${testCase.expectedIntent}`);
      console.log(`   Got: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`);
    }

    results.push({
      ...testCase,
      actualIntent: result.intent,
      confidence: result.confidence,
      passed: isCorrect
    });

    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('\n📊 Test Summary:\n');
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / testCases.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Breakdown by intent
  console.log('Breakdown by Intent:');
  const intentGroups = {
    policy_question: 5,
    order_status: 5,
    product_search: 5,
    complaint: 5,
    chitchat: 5,
    off_topic: 4,
    violation: 3
  };

  for (const [intent, total] of Object.entries(intentGroups)) {
    const intentResults = results.filter(r => r.expectedIntent === intent);
    const intentPassed = intentResults.filter(r => r.passed).length;
    console.log(`  ${intent}: ${intentPassed}/${total} passed`);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});