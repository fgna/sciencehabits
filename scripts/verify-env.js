#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * 
 * Checks if all required environment variables are available
 * for the admin authentication system.
 */

const requiredEnvVars = [
  'REACT_APP_ADMIN_EMAIL',
  'REACT_APP_ADMIN_PASSWORD',
  'REACT_APP_SECONDARY_ADMIN_EMAIL',
  'REACT_APP_SECONDARY_ADMIN_PASSWORD'
];

console.log('🔍 Verifying environment variables for admin authentication...\n');

let allPresent = true;
const results = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = Boolean(value);
  
  results.push({
    name: varName,
    present: isPresent,
    masked: isPresent ? value.replace(/./g, '*') : 'NOT SET'
  });
  
  if (!isPresent) {
    allPresent = false;
  }
});

// Display results
results.forEach(result => {
  const status = result.present ? '✅' : '❌';
  console.log(`${status} ${result.name}: ${result.masked}`);
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('✅ All environment variables are properly configured!');
  console.log('🚀 Admin authentication should work correctly.');
  console.log('\n📝 Test admin login at: http://localhost:3000/#admin');
  console.log(`📧 Email: ${process.env.REACT_APP_ADMIN_EMAIL}`);
  console.log('🔐 Password: [as configured]');
} else {
  console.log('❌ Missing environment variables detected!');
  console.log('\n🔧 To fix this:');
  console.log('1. Ensure .env.local file exists with all required variables');
  console.log('2. For Vercel deployment, add these variables in Vercel dashboard');
  console.log('3. See DEPLOYMENT.md for detailed instructions');
  
  process.exit(1);
}

console.log('\n🔗 For Vercel deployment instructions, see: DEPLOYMENT.md');