// Test script to verify Vercel deployment
const https = require('https');

const testUrl = 'https://mr-pikipiki-trading-3axh.vercel.app';

console.log('🧪 Testing Vercel Deployment...\n');

// Test 1: Health Check
console.log('1. Testing Health Check...');
https.get(`${testUrl}/api/health`, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Health Check Response:', data);
    console.log('Status:', res.statusCode);
  });
}).on('error', (err) => {
  console.log('❌ Health Check Failed:', err.message);
});

// Test 2: Database Test
console.log('\n2. Testing Database Connection...');
https.get(`${testUrl}/api/test-db`, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Database Test Response:', data);
    console.log('Status:', res.statusCode);
  });
}).on('error', (err) => {
  console.log('❌ Database Test Failed:', err.message);
});

// Test 3: Main Page
console.log('\n3. Testing Main Page...');
https.get(testUrl, (res) => {
  console.log('✅ Main Page Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
}).on('error', (err) => {
  console.log('❌ Main Page Failed:', err.message);
});

console.log('\n🔍 If tests fail, check:');
console.log('- Environment variables in Vercel dashboard');
console.log('- Deployment logs in Vercel dashboard');
console.log('- MongoDB connection settings');
