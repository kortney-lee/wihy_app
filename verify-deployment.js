#!/usr/bin/env node

/**
 * Pre-deployment verification script
 * Checks that all necessary files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'client/package.json',
  'client/build/index.html',
  'staticwebapp.config.json',
  '.github/workflows/azure-static-web-apps.yml',
  '.env.example',
  'client/.env.production'
];

const requiredDirs = [
  'client/build',
  'client/build/static',
  '.github/workflows'
];

console.log('🔍 WiHy UI Deployment Verification');
console.log('=====================================\n');

let allGood = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allGood = false;
  }
});

console.log('\n📂 Checking required directories:');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir}`);
  } else {
    console.log(`   ❌ ${dir} - MISSING`);
    allGood = false;
  }
});

// Check build artifacts
console.log('\n🏗️  Checking build artifacts:');
const buildDir = 'client/build';
if (fs.existsSync(buildDir)) {
  const buildFiles = fs.readdirSync(buildDir);
  const hasIndex = buildFiles.includes('index.html');
  const hasStatic = buildFiles.includes('static');
  const hasManifest = buildFiles.includes('asset-manifest.json');
  
  console.log(`   ${hasIndex ? '✅' : '❌'} index.html`);
  console.log(`   ${hasStatic ? '✅' : '❌'} static directory`);
  console.log(`   ${hasManifest ? '✅' : '❌'} asset-manifest.json`);
  
  if (!hasIndex || !hasStatic || !hasManifest) {
    allGood = false;
  }
} else {
  console.log('   ❌ Build directory not found');
  allGood = false;
}

// Check package.json configurations
console.log('\n📦 Checking package.json configurations:');
try {
  const clientPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  const hasHomepage = clientPkg.homepage !== undefined;
  const hasReactScripts = clientPkg.dependencies['react-scripts'] !== undefined;
  const hasBuildScript = clientPkg.scripts && clientPkg.scripts.build !== undefined;
  
  console.log(`   ${hasHomepage ? '✅' : '❌'} Homepage field configured`);
  console.log(`   ${hasReactScripts ? '✅' : '❌'} React Scripts dependency`);
  console.log(`   ${hasBuildScript ? '✅' : '❌'} Build script defined`);
  
  if (!hasHomepage || !hasReactScripts || !hasBuildScript) {
    allGood = false;
  }
} catch (error) {
  console.log('   ❌ Error reading client/package.json');
  allGood = false;
}

// Check environment configuration
console.log('\n🌍 Checking environment configuration:');
try {
  const envProd = fs.readFileSync('client/.env.production', 'utf8');
  const hasApiUrl = envProd.includes('REACT_APP_API_BASE_URL');
  const hasEnv = envProd.includes('REACT_APP_ENVIRONMENT');
  
  console.log(`   ${hasApiUrl ? '✅' : '❌'} API Base URL configured`);
  console.log(`   ${hasEnv ? '✅' : '❌'} Environment configured`);
  
  if (!hasApiUrl || !hasEnv) {
    allGood = false;
  }
} catch (error) {
  console.log('   ❌ Error reading .env.production');
  allGood = false;
}

console.log('\n' + '='.repeat(40));
if (allGood) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Push to GitHub to trigger deployment');
  console.log('2. Check GitHub Actions for deployment status');
  console.log('3. Configure environment variables in Azure');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\nFor help, see DEPLOYMENT.md');
  process.exit(1);
}