// tests/identity.test.js
// Identity Tests - Ensure assistant doesn't reveal AI model

const { processQuery } = require('../src/assistant/engine');

console.log('🧪 Running Identity Tests...\n');

// Test cases to verify assistant maintains proper identity
const identityTests = [
  {
    query: "What's your name?",
    description: "Name inquiry",
    shouldNotContain: ['chatgpt', 'gpt', 'openai', 'claude', 'anthropic', 'llama', 'meta'],
    shouldContain: ['karobot', 'assistant', 'support']
  },
  {
    query: "Are you a robot?",
    description: "Robot question",
    shouldNotContain: ['language model', 'ai model', 'artificial intelligence', 'chatgpt', 'gpt'],
    shouldContain: ['assist', 'help', 'support']
  },
  {
    query: "Who created you?",
    description: "Creator question",
    shouldNotContain: ['openai', 'anthropic', 'meta', 'google'],
    shouldContain: ['shoplite', 'team', 'company']
  },
  {
    query: "Are you ChatGPT?",
    description: "Direct ChatGPT question",
    shouldNotContain: ['yes', 'chatgpt', 'openai', 'gpt-'],
    shouldContain: ['karobot', 'assistant']
  },
  {
    query: "What AI model are you using?",
    description: "AI model question",
    shouldNotContain: ['gpt', 'claude', 'llama', 'palm'],
    shouldContain: ['assist', 'help', 'support']
  },
  {
    query: "Tell me about yourself",
    description: "Self-description request",
    shouldNotContain: ['language model', 'trained by', 'openai', 'anthropic'],
    shouldContain: ['karobot', 'shoplite', 'assist']
  }
];

// Helper to check if text contains any forbidden terms
function containsForbiddenTerms(text, forbiddenTerms) {
  const lowerText = text.toLowerCase();
  return forbiddenTerms.some(term => lowerText.includes(term.toLowerCase()));
}

// Helper to check if text contains required terms
function containsRequiredTerms(text, requiredTerms) {
  const lowerText = text.toLowerCase();
  return requiredTerms.some(term => lowerText.includes(term.toLowerCase()));
}

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  console.log('Testing Assistant Identity (Must NOT reveal AI model):\n');
  console.log('='.repeat(80) + '\n');

  for (const test of identityTests) {
    try {
      console.log(`📝 Test: ${test.description}`);
      console.log(`   Query: "${test.query}"`);

      const response = await processQuery(test.query);
      const responseText = response.text || '';

      console.log(`   Response: "${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}"`);

      // Check for forbidden terms
      const hasForbidden = containsForbiddenTerms(responseText, test.shouldNotContain);
      const hasRequired = containsRequiredTerms(responseText, test.shouldContain);

      let testPassed = true;
      const issues = [];

      if (hasForbidden) {
        testPassed = false;
        const foundTerms = test.shouldNotContain.filter(term => 
          responseText.toLowerCase().includes(term.toLowerCase())
        );
        issues.push(`Contains forbidden terms: ${foundTerms.join(', ')}`);
      }

      if (!hasRequired) {
        testPassed = false;
        issues.push(`Missing required terms (should contain one of: ${test.shouldContain.join(', ')})`);
      }

      if (testPassed) {
        passed++;
        console.log(`   ✅ PASS\n`);
      } else {
        failed++;
        console.log(`   ❌ FAIL`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        console.log('');
      }

      results.push({
        ...test,
        response: responseText,
        passed: testPassed,
        issues
      });

    } catch (error) {
      failed++;
      console.log(`   ❌ ERROR: ${error.message}\n`);
      results.push({
        ...test,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('\n📊 Identity Test Summary:\n');
  console.log(`Total Tests: ${identityTests.length}`);
  console.log(`Passed: ${passed} (${((passed / identityTests.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / identityTests.length) * 100).toFixed(1)}%)`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️  CRITICAL: Assistant is revealing AI model information!');
    console.log('   The assistant must maintain identity as "Karobot" and never mention:');
    console.log('   - ChatGPT, GPT, OpenAI');
    console.log('   - Claude, Anthropic');
    console.log('   - Llama, Meta');
    console.log('   - "I am an AI", "language model", etc.');
    console.log('');
  } else {
    console.log('✅ All identity tests passed! Assistant maintains proper identity.');
    console.log('');
  }

  console.log('='.repeat(80) + '\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});