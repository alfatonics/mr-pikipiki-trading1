// Test script to verify Vercel deployment fix
const https = require('https');

const testUrl = 'https://mr-pikipiki-trading-cpr5.vercel.app';

console.log('🧪 Testing Vercel Deployment Fix...\n');

// Test 1: Health Check
console.log('1. Testing Health Check...');
https.get(`${testUrl}/api/health`, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Health Check: SUCCESS');
      console.log('Response:', data);
    } else {
      console.log('❌ Health Check: FAILED');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
}).on('error', (err) => {
  console.log('❌ Health Check: ERROR -', err.message);
});

// Test 2: Database Test
console.log('\n2. Testing Database Connection...');
https.get(`${testUrl}/api/test-db`, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Database Test: SUCCESS');
      console.log('Response:', data);
    } else {
      console.log('❌ Database Test: FAILED');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
}).on('error', (err) => {
  console.log('❌ Database Test: ERROR -', err.message);
});

// Test 3: Main Page
console.log('\n3. Testing Main Page...');
https.get(testUrl, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Main Page: SUCCESS');
    console.log('Status:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
  } else {
    console.log('❌ Main Page: FAILED');
    console.log('Status:', res.statusCode);
  }
}).on('error', (err) => {
  console.log('❌ Main Page: ERROR -', err.message);
});

console.log('\n🔍 If tests still fail:');
console.log('1. Check environment variables in Vercel dashboard');
console.log('2. Wait for redeployment to complete');
console.log('3. Check Vercel deployment logs');
console.log('4. Verify MongoDB connection settings');
