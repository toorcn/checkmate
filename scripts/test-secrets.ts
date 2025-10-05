/**
 * Test script to verify Secrets Manager integration
 * Run with: npx tsx scripts/test-secrets.ts
 */

import { 
  getFirecrawlApiKey, 
  getExaApiKey, 
  getAuthSecret,
  getRDSCredentials 
} from '../lib/secrets';

async function testSecrets() {
  console.log('🔍 Testing Secrets Manager Integration...\n');
  
  console.log('Environment:');
  console.log('  USE_SECRETS_MANAGER:', process.env.USE_SECRETS_MANAGER);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  AWS_REGION:', process.env.AWS_REGION || process.env.APP_REGION);
  console.log('');

  // Test Firecrawl API Key
  console.log('📝 Testing Firecrawl API Key...');
  try {
    const firecrawlKey = await getFirecrawlApiKey();
    if (firecrawlKey) {
      console.log(`✅ Firecrawl API Key: ${firecrawlKey.substring(0, 10)}...${firecrawlKey.substring(firecrawlKey.length - 5)} (length: ${firecrawlKey.length})`);
    } else {
      console.log('❌ Firecrawl API Key is empty or null');
    }
  } catch (error) {
    console.log('❌ Error fetching Firecrawl API Key:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test Exa API Key
  console.log('📝 Testing Exa API Key...');
  try {
    const exaKey = await getExaApiKey();
    if (exaKey) {
      console.log(`✅ Exa API Key: ${exaKey.substring(0, 10)}...${exaKey.substring(exaKey.length - 5)} (length: ${exaKey.length})`);
    } else {
      console.log('❌ Exa API Key is empty or null');
    }
  } catch (error) {
    console.log('❌ Error fetching Exa API Key:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test Auth Secret
  console.log('📝 Testing Auth Secret...');
  try {
    const authSecret = await getAuthSecret();
    if (authSecret.secret) {
      console.log(`✅ Auth Secret: ${authSecret.secret.substring(0, 10)}...${authSecret.secret.substring(authSecret.secret.length - 5)} (length: ${authSecret.secret.length})`);
      console.log(`   Admin Email: ${authSecret.adminEmail || 'not set'}`);
    } else {
      console.log('❌ Auth Secret is empty or null');
    }
  } catch (error) {
    console.log('❌ Error fetching Auth Secret:', error instanceof Error ? error.message : error);
  }
  console.log('');

  // Test Database Credentials
  console.log('📝 Testing Database Credentials...');
  try {
    const dbCreds = await getRDSCredentials();
    if (dbCreds.username && dbCreds.password) {
      console.log(`✅ DB Username: ${dbCreds.username}`);
      console.log(`✅ DB Password: ${dbCreds.password.substring(0, 5)}... (length: ${dbCreds.password.length})`);
      if (dbCreds.host) console.log(`   DB Host: ${dbCreds.host}`);
      if (dbCreds.port) console.log(`   DB Port: ${dbCreds.port}`);
      if (dbCreds.dbname) console.log(`   DB Name: ${dbCreds.dbname}`);
    } else {
      console.log('❌ Database credentials are incomplete');
    }
  } catch (error) {
    console.log('❌ Error fetching Database Credentials:', error instanceof Error ? error.message : error);
  }
  console.log('');

  console.log('✨ Secrets test complete!');
}

testSecrets().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

