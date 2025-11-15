#!/usr/bin/env node

/**
 * Test script to verify Chromium/Puppeteer is working in Docker
 *
 * Usage:
 *   node test-chromium.js
 *
 * Or inside Docker:
 *   docker run --rm myjobv2 node test-chromium.js
 */

const puppeteer = require('puppeteer');

async function testChromium() {
  console.log('🔍 Testing Chromium installation...\n');

  // Check environment variables
  console.log('Environment variables:');
  console.log('  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD);
  console.log('  PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
  console.log('');

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    console.log('✅ Browser launched successfully!');

    // Get browser version
    const version = await browser.version();
    console.log('📦 Browser version:', version);

    // Create a page and test basic functionality
    console.log('📄 Creating new page...');
    const page = await browser.newPage();

    console.log('🌐 Navigating to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle0', timeout: 10000 });

    const title = await page.title();
    console.log('📄 Page title:', title);

    // Test PDF generation
    console.log('📑 Testing PDF generation...');
    const pdfBuffer = await page.pdf({ format: 'A4' });
    console.log('📑 PDF generated successfully! Size:', pdfBuffer.length, 'bytes');

    await browser.close();
    console.log('\n✅ All tests passed! Chromium is working correctly.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testChromium();
