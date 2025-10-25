// Vercel Deployment Debug Script
import https from 'https';

console.log('🔍 VERCEL DEPLOYMENT DEBUG SCRIPT');
console.log('=====================================\n');

// Test URLs to check
const testUrls = [
  'https://mr-pikipiki-trading.vercel.app',
  'https://mr-pikipiki-trading-cpr5.vercel.app',
  'https://mr-pikipiki-trading-3axh.vercel.app'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`🧪 Testing: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
        console.log(`   Response: ${data.substring(0, 200)}...`);
        resolve({ url, status: res.statusCode, data: data.substring(0, 200) });
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve({ url, status: 'ERROR', error: err.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`   ⏰ Timeout after 10 seconds`);
      req.destroy();
      resolve({ url, status: 'TIMEOUT', error: 'Request timeout' });
    });
  });
}

async function testApiEndpoint(baseUrl) {
  return new Promise((resolve) => {
    const apiUrl = `${baseUrl}/api/health`;
    console.log(`🔧 Testing API: ${apiUrl}`);
    
    const req = https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   API Status: ${res.statusCode}`);
        console.log(`   API Response: ${data}`);
        resolve({ url: apiUrl, status: res.statusCode, data });
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ API Error: ${err.message}`);
      resolve({ url: apiUrl, status: 'ERROR', error: err.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`   ⏰ API Timeout`);
      req.destroy();
      resolve({ url: apiUrl, status: 'TIMEOUT', error: 'API timeout' });
    });
  });
}

async function runDebugTests() {
  console.log('📋 DEBUGGING CHECKLIST:');
  console.log('1. ✅ Local app working (confirmed from terminal logs)');
  console.log('2. 🔍 Testing Vercel deployment URLs...\n');
  
  const results = [];
  
  for (const url of testUrls) {
    console.log(`\n🌐 Testing URL: ${url}`);
    console.log('─'.repeat(50));
    
    // Test main page
    const mainResult = await testUrl(url);
    results.push(mainResult);
    
    // Test API endpoint
    const apiResult = await testApiEndpoint(url);
    results.push(apiResult);
    
    console.log('');
  }
  
  console.log('\n📊 DEBUG RESULTS SUMMARY:');
  console.log('========================');
  
  results.forEach(result => {
    if (result.status === 200) {
      console.log(`✅ ${result.url} - WORKING`);
    } else if (result.status === 'ERROR') {
      console.log(`❌ ${result.url} - ERROR: ${result.error}`);
    } else if (result.status === 'TIMEOUT') {
      console.log(`⏰ ${result.url} - TIMEOUT`);
    } else {
      console.log(`⚠️  ${result.url} - Status: ${result.status}`);
    }
  });
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Check Vercel dashboard for correct deployment URL');
  console.log('2. Verify environment variables are set');
  console.log('3. Check deployment logs in Vercel dashboard');
  console.log('4. Ensure all dependencies are installed');
  console.log('5. Verify MongoDB connection settings');
  
  console.log('\n📋 ENVIRONMENT VARIABLES NEEDED:');
  console.log('MONGODB_URI=mongodb+srv://mrpikipiki:bp2kOzatPLUW5RfG@mrpikipiki.zqt65e1.mongodb.net/mr-pikipiki-trading?retryWrites=true&w=majority&appName=mrpikipiki');
  console.log('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345');
  console.log('NODE_ENV=production');
}

// Run the debug tests
runDebugTests().catch(console.error);
