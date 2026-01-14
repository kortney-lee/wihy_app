/**
 * Post-build script to inject SEO meta tags into Expo-generated index.html
 * Run after `expo export --platform web`
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

// SEO content to inject
const seoHead = `
    <!-- Google Analytics (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-X3TDLWKKWH"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-X3TDLWKKWH');
    </script>

    <!-- Primary SEO Meta Tags -->
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="keywords" content="nutrition coach, fitness coach, health intelligence platform, personal training AI, nutrition tracking, food scanner, meal analysis, health coaching platform, evidence-based nutrition, AI fitness guide, WiHY AI, what is healthy, healthy eating" />
    <meta name="author" content="Wihy.ai" />
    <meta name="title" content="WIHY AI | World's Smartest Health Search Engine" />
    <meta name="description" content="WIHY AI is the world's smartest health search engine. Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success." />

    <!-- Canonical URL -->
    <link rel="canonical" href="https://wihy.ai/" />

    <!-- Preconnect for Performance -->
    <link rel="preconnect" href="https://www.googletagmanager.com" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="dns-prefetch" href="https://wihy.ai" />

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/Favicon.png?v=20260114" />
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/Favicon.png?v=20260114" />
    <link rel="icon" type="image/png" sizes="192x192" href="/assets/Favicon.png?v=20260114" />
    <link rel="apple-touch-icon" href="/assets/Favicon.png?v=20260114" />
    <link rel="manifest" href="/manifest.json?v=20260114" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://wihy.ai/" />
    <meta property="og:site_name" content="WIHY AI" />
    <meta property="og:title" content="WIHY AI | World's Smartest Health Search Engine" />
    <meta property="og:description" content="Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success." />
    <meta property="og:image" content="https://wihy.ai/assets/Favicon.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://wihy.ai/" />
    <meta name="twitter:title" content="WIHY AI | World's Smartest Health Search Engine" />
    <meta name="twitter:description" content="Evidence-based nutrition and fitness answers for individuals, plus a coaching platform after login to track client success." />
    <meta name="twitter:image" content="https://wihy.ai/assets/Favicon.png" />

    <!-- Additional SEO -->
    <meta name="application-name" content="WIHY AI" />
    <meta name="apple-mobile-web-app-title" content="WIHY AI" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="mobile-web-app-capable" content="yes" />
`;

try {
  // Check if dist/index.html exists
  if (!fs.existsSync(indexPath)) {
    console.error('Error: dist/index.html not found. Run "expo export --platform web" first.');
    process.exit(1);
  }

  // Read the Expo-generated index.html
  let html = fs.readFileSync(indexPath, 'utf8');

  // Update the title
  html = html.replace(/<title>.*?<\/title>/i, '<title>WIHY AI | World\'s Smartest Health Search Engine</title>');

  // Inject SEO tags right after <head>
  html = html.replace(/<head>/i, `<head>${seoHead}`);

  // Write the updated HTML
  fs.writeFileSync(indexPath, html);

  console.log('✅ SEO meta tags injected into dist/index.html');

  // Copy favicon to dist/assets if not already there
  const faviconSrc = path.join(__dirname, '../assets/Favicon.png');
  const faviconDest = path.join(distPath, 'assets/Favicon.png');
  
  if (fs.existsSync(faviconSrc)) {
    // Ensure dist/assets exists
    const assetsDir = path.join(distPath, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    fs.copyFileSync(faviconSrc, faviconDest);
    console.log('✅ Favicon copied to dist/assets/Favicon.png');
  } else {
    console.warn('⚠️ Favicon.png not found in assets folder');
  }

  // Copy manifest.json
  const manifestSrc = path.join(__dirname, '../web/manifest.json');
  const manifestDest = path.join(distPath, 'manifest.json');
  
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('✅ manifest.json copied to dist/');
  }

  console.log('\n🚀 Production build ready for deployment!');

} catch (error) {
  console.error('Error injecting SEO:', error);
  process.exit(1);
}
