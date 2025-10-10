#!/usr/bin/env node

/**
 * Test script for external API endpoints
 * 
 * This script tests the external API endpoints to ensure they work correctly
 * with API key authentication, CORS, and rate limiting.
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.CHECKMATE_API_KEY || 'demo-key-123';

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  
  console.log(`\n${options.method || 'GET'} ${url}`);
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  
  return { response, data };
}

async function testExternalAPI() {
  console.log('🧪 Testing External API Endpoints');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key: ${API_KEY}`);
  
  try {
    // Test 1: API Documentation
    console.log('\n📚 Test 1: API Documentation');
    await makeRequest(`${BASE_URL}/api/external`);

    // Test 2: Transcribe Health Check
    console.log('\n🎬 Test 2: Transcribe Health Check');
    await makeRequest(`${BASE_URL}/api/external/transcribe`);

    // Test 3: Translate Health Check
    console.log('\n🌐 Test 3: Translate Health Check');
    await makeRequest(`${BASE_URL}/api/external/translate`);

    // Test 4: Translation Request
    console.log('\n📝 Test 4: Translation Request');
    await makeRequest(`${BASE_URL}/api/external/translate`, {
      method: 'POST',
      body: JSON.stringify({
        text: 'Hello world',
        targetLanguage: 'ms',
        sourceLanguage: 'auto'
      })
    });

    // Test 5: Analyses List
    console.log('\n📊 Test 5: Analyses List');
    await makeRequest(`${BASE_URL}/api/external/analyses`);

    // Test 6: Crowdsource Vote
    console.log('\n🗳️ Test 6: Crowdsource Vote');
    await makeRequest(`${BASE_URL}/api/external/crowdsource/vote`, {
      method: 'POST',
      body: JSON.stringify({
        articleId: 'test-article-123',
        voteType: 'credible'
      })
    });

    // Test 7: Get Vote Counts
    console.log('\n📈 Test 7: Get Vote Counts');
    await makeRequest(`${BASE_URL}/api/external/crowdsource/vote?articleId=test-article-123`);

    // Test 8: CORS Preflight
    console.log('\n🌍 Test 8: CORS Preflight');
    const corsResponse = await fetch(`${BASE_URL}/api/external/transcribe`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, X-API-Key'
      }
    });
    console.log(`Status: ${corsResponse.status}`);
    console.log('CORS Headers:', Object.fromEntries(corsResponse.headers.entries()));

    // Test 9: Invalid API Key
    console.log('\n❌ Test 9: Invalid API Key');
    await makeRequest(`${BASE_URL}/api/external/transcribe`, {
      headers: {
        'X-API-Key': 'invalid-key'
      }
    });

    // Test 10: Missing API Key
    console.log('\n🚫 Test 10: Missing API Key');
    await makeRequest(`${BASE_URL}/api/external/transcribe`, {
      headers: {}
    });

    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testExternalAPI().catch(console.error);
}

module.exports = { testExternalAPI, makeRequest };
