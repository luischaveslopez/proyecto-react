const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function executeCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute command: ${command}`);
    process.exit(1);
  }
}

function checkEnvironmentVariables() {
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    process.exit(1);
  }
}

function deployFunctions() {
  console.log('🚀 Starting deployment process...');

  // Check if .env file exists
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    console.error('❌ .env file not found. Please create one from .env.example');
    process.exit(1);
  }

  // Check environment variables
  console.log('📝 Checking environment variables...');
  checkEnvironmentVariables();

  // Set Firebase Functions configuration
  console.log('⚙️ Setting Firebase Functions configuration...');
  executeCommand(`firebase functions:config:set email.user="${process.env.EMAIL_USER}" email.pass="${process.env.EMAIL_PASS}"`);

  if (process.env.FIREBASE_PROJECT_ID) {
    executeCommand(`firebase use ${process.env.FIREBASE_PROJECT_ID}`);
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  executeCommand('npm install');

  // Deploy functions
  console.log('🚀 Deploying Firebase Functions...');
  executeCommand('firebase deploy --only functions');

  console.log('✅ Deployment completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the notifications system');
  console.log('2. Monitor the Firebase Functions logs');
  console.log('3. Check email delivery in Gmail');
}

// Run deployment
deployFunctions();
