// tests/api.test.js
// API Endpoint Tests - Test all major endpoints

const API_URL = process.env.API_URL || 'http://localhost:5000';

console.log('🧪 Running API Endpoint Tests...\n');
console.log(`Testing API at: ${API_URL}\n`);
console.log('='.repeat(80) + '\n');

let passed = 0;
let failed = 0;

// Helper function for API calls
async function testEndpoint(name, method, url, options = {}) {
  try {
    console.log(`📝 ${name}`);
    console.log(`   ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`   Status: ${response.status}`);
    return { response, data, success: response.ok };

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { error, success: false };
  }
}

// Test Suite
async function runTests() {
  
  // Test 1: Health Check
  {
    const result = await testEndpoint(
      'Health Check',
      'GET',
      `${API_URL}/health`
    );

    if (result.success && result.data.status === 'ok') {
      passed++;
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL\n`);
    }
  }

  // Test 2: Get Products List
  {
    const result = await testEndpoint(
      'Get Products List',
      'GET',
      `${API_URL}/api/products?limit=5`
    );

    if (result.success && result.data.products && Array.isArray(result.data.products)) {
      passed++;
      console.log(`   Products returned: ${result.data.products.length}`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Expected products array\n`);
    }
  }

  // Test 3: Get Single Product
  {
    // First get a product ID
    const productsResult = await fetch(`${API_URL}/api/products?limit=1`);
    const productsData = await productsResult.json();
    const productId = productsData.products?.[0]?._id;

    if (productId) {
      const result = await testEndpoint(
        'Get Single Product',
        'GET',
        `${API_URL}/api/products/${productId}`
      );

      if (result.success && result.data._id) {
        passed++;
        console.log(`   Product: ${result.data.name}`);
        console.log(`   ✅ PASS\n`);
      } else {
        failed++;
        console.log(`   ❌ FAIL\n`);
      }
    } else {
      console.log(`   ⚠️  SKIP - No products in database\n`);
    }
  }

  // Test 4: Get Customer by Email
  {
    const result = await testEndpoint(
      'Get Customer by Email',
      'GET',
      `${API_URL}/api/customers?email=demo@example.com`
    );

    if (result.success && result.data.email) {
      passed++;
      console.log(`   Customer: ${result.data.name}`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Customer not found (database may not be seeded)\n`);
    }
  }

  // Test 5: Create Order (Valid)
  {
    // First get customer and product IDs
    const customerResult = await fetch(`${API_URL}/api/customers?email=demo@example.com`);
    const customer = await customerResult.json();
    
    const productsResult = await fetch(`${API_URL}/api/products?limit=1`);
    const productsData = await productsResult.json();
    const product = productsData.products?.[0];

    if (customer._id && product) {
      const result = await testEndpoint(
        'Create Order (Valid Data)',
        'POST',
        `${API_URL}/api/orders`,
        {
          body: JSON.stringify({
            customerId: customer._id,
            items: [
              {
                productId: product._id,
                quantity: 1
              }
            ]
          })
        }
      );

      if (result.response?.status === 201 && result.data._id) {
        passed++;
        console.log(`   Order ID: ${result.data._id}`);
        console.log(`   Status: ${result.data.status}`);
        console.log(`   ✅ PASS\n`);
      } else {
        failed++;
        console.log(`   ❌ FAIL\n`);
      }
    } else {
      console.log(`   ⚠️  SKIP - Missing test data\n`);
    }
  }

  // Test 6: Create Order (Invalid - Missing Data)
  {
    const result = await testEndpoint(
      'Create Order (Invalid Data)',
      'POST',
      `${API_URL}/api/orders`,
      {
        body: JSON.stringify({
          // Missing customerId and items
        })
      }
    );

    if (result.response?.status === 400) {
      passed++;
      console.log(`   Correctly returned 400 Bad Request`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Expected 400 status\n`);
    }
  }

  // Test 7: Get Orders for Customer
  {
    const customerResult = await fetch(`${API_URL}/api/customers?email=demo@example.com`);
    const customer = await customerResult.json();

    if (customer._id) {
      const result = await testEndpoint(
        'Get Customer Orders',
        'GET',
        `${API_URL}/api/orders?customerId=${customer._id}`
      );

      if (result.success && Array.isArray(result.data)) {
        passed++;
        console.log(`   Orders found: ${result.data.length}`);
        console.log(`   ✅ PASS\n`);
      } else {
        failed++;
        console.log(`   ❌ FAIL - Expected orders array\n`);
      }
    } else {
      console.log(`   ⚠️  SKIP - Customer not found\n`);
    }
  }

  // Test 8: Get 404 for Non-existent Resource
  {
    const result = await testEndpoint(
      'Get Non-existent Product (404 Test)',
      'GET',
      `${API_URL}/api/products/000000000000000000000000`
    );

    if (result.response?.status === 404) {
      passed++;
      console.log(`   Correctly returned 404 Not Found`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Expected 404 status\n`);
    }
  }

  // Test 9: Analytics - Daily Revenue
  {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await testEndpoint(
      'Get Daily Revenue Analytics',
      'GET',
      `${API_URL}/api/analytics/daily-revenue?from=${weekAgo}&to=${today}`
    );

    if (result.success && Array.isArray(result.data)) {
      passed++;
      console.log(`   Data points: ${result.data.length}`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Expected array of revenue data\n`);
    }
  }

  // Test 10: Analytics - Dashboard Metrics
  {
    const result = await testEndpoint(
      'Get Dashboard Metrics',
      'GET',
      `${API_URL}/api/analytics/dashboard-metrics`
    );

    if (result.success && 
        typeof result.data.totalRevenue === 'number' &&
        typeof result.data.totalOrders === 'number') {
      passed++;
      console.log(`   Total Revenue: ${result.data.totalRevenue.toFixed(2)}`);
      console.log(`   Total Orders: ${result.data.totalOrders}`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Invalid metrics format\n`);
    }
  }

  // Test 11: Assistant Chat Endpoint
  {
    const result = await testEndpoint(
      'Assistant Chat',
      'POST',
      `${API_URL}/api/assistant/chat`,
      {
        body: JSON.stringify({
          query: 'What is your return policy?'
        })
      }
    );

    if (result.success && result.data.text) {
      passed++;
      console.log(`   Response received: ${result.data.text.substring(0, 50)}...`);
      console.log(`   Intent: ${result.data.intent}`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - No response text\n`);
    }
  }

  // Test 12: Error Responses are JSON
  {
    const result = await testEndpoint(
      'Error Response Format',
      'GET',
      `${API_URL}/api/products/invalid-id-format`
    );

    const contentType = result.response?.headers.get('content-type');
    const isJSON = contentType && contentType.includes('application/json');

    if (isJSON && result.data && typeof result.data === 'object') {
      passed++;
      console.log(`   Error response is valid JSON`);
      console.log(`   ✅ PASS\n`);
    } else {
      failed++;
      console.log(`   ❌ FAIL - Error response is not JSON\n`);
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('\n📊 API Test Summary:\n');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed} (${((passed / (passed + failed)) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / (passed + failed)) * 100).toFixed(1)}%)`);
  console.log('\n' + '='.repeat(80) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});