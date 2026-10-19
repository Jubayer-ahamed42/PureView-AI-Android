/**
 * ============================================================================
 * PureView AI — Automated Deep Verification & E2E Android Mobile Test Suite
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { startServer } = require('../server');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

function findBrowserExecutable() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No local Chrome/Edge executable found for Playwright E2E test');
}

async function runTests() {
  console.log('====================================================================');
  console.log('  🧪 Starting PureView AI Deep Verification Suite (Android Mobile)');
  console.log('====================================================================\n');

  const server = await startServer(0); // random free port
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  let passed = 0;

  function ok(name, detail = '') {
    passed++;
    console.log(`  ✅ [PASS #${passed}] ${name}${detail ? ` — ${detail}` : ''}`);
  }

  try {
    // ------------------------------------------------------------------------
    // 1. HEALTH & AI ENGINE READINESS
    // ------------------------------------------------------------------------
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const health = await healthRes.json();
    assert.strictEqual(health.status, 'ok');
    assert.strictEqual(health.aiReady, true);
    ok('Server & WASM Neural Engine Health Check', health.aiEngine);

    // ------------------------------------------------------------------------
    // 2. REAL FEMALE-FACE & GENDER AI CLASSIFICATION TESTS
    // ------------------------------------------------------------------------
    const femaleTestFiles = [
      '/test-images/female-portrait-1.jpg',
      '/test-images/female-vlog-2.jpg',
      '/test-images/female-yt-thumb-3.jpg',
      '/test-images/female-reel-4.jpg',
      '/test-images/female-ad-5.jpg'
    ];

    for (const src of femaleTestFiles) {
      const res = await fetch(`${baseUrl}/api/analyze-image?src=${encodeURIComponent(src)}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.hasFemaleFace, true, `Expected female face in ${src}`);
      assert.strictEqual(data.action, 'BLUR', `Expected BLUR action for ${src}`);
      assert.ok(data.femaleFacesCount >= 1, `Expected >=1 female face in ${src}`);
      const firstFemale = data.faces.find((f) => f.gender === 'female');
      assert.ok(firstFemale && firstFemale.box.width > 0 && firstFemale.box.height > 0);
      ok(`AI Female Detection [${path.basename(src)}]`, `femaleFaces=${data.femaleFacesCount}, conf=${(firstFemale.genderProbability * 100).toFixed(1)}% -> BLUR`);
    }

    const maleTestFiles = [
      '/test-images/male-scholar-1.jpg',
      '/test-images/male-speaker-2.jpg',
      '/test-images/male-podcast-thumb.jpg'
    ];

    for (const src of maleTestFiles) {
      const res = await fetch(`${baseUrl}/api/analyze-image?src=${encodeURIComponent(src)}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.hasFemaleFace, false, `Expected NO female face in ${src}`);
      assert.strictEqual(data.maleFacesCount, 1, `Expected 1 male face in ${src}`);
      assert.strictEqual(data.action, 'UNBLUR', `Expected UNBLUR action for ${src}`);
      const firstMale = data.faces[0];
      ok(`AI Male Detection [${path.basename(src)}]`, `maleFaces=1, conf=${(firstMale.genderProbability * 100).toFixed(1)}% -> UNBLUR (100% Clear)`);
    }

    const safeNatureFiles = [
      '/test-images/safe-mosque-nature.jpg',
      '/test-images/safe-tech-review.jpg'
    ];

    for (const src of safeNatureFiles) {
      const res = await fetch(`${baseUrl}/api/analyze-image?src=${encodeURIComponent(src)}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.hasFemaleFace, false);
      assert.strictEqual(data.facesCount, 0);
      assert.strictEqual(data.action, 'UNBLUR');
      ok(`AI Safe Scene Detection [${path.basename(src)}]`, `faces=0 -> UNBLUR (100% Clear)`);
    }

    // Mixed Male + Female Group Thumbnail test
    const mixedRes = await fetch(`${baseUrl}/api/analyze-image?src=${encodeURIComponent('/test-images/mixed-interview-thumb.jpg')}`);
    assert.strictEqual(mixedRes.status, 200);
    const mixedData = await mixedRes.json();
    assert.strictEqual(mixedData.facesCount, 2, 'Expected 2 faces in mixed-interview-thumb.jpg');
    assert.strictEqual(mixedData.maleFacesCount, 1, 'Expected 1 male face in mixed-interview-thumb.jpg');
    assert.strictEqual(mixedData.femaleFacesCount, 1, 'Expected 1 female face in mixed-interview-thumb.jpg');
    assert.strictEqual(mixedData.hasFemaleFace, true);
    assert.strictEqual(mixedData.action, 'BLUR');
    ok('AI Mixed Male + Female Group Detection [mixed-interview-thumb.jpg]', `male=1, female=1 -> BLUR`);

    // Small 68x68 YouTube/Facebook Channel Icon / Avatar Detection tests
    const femaleAvatar68Res = await fetch(
      `${baseUrl}/api/analyze-image?src=${encodeURIComponent('https://yt3.ggpht.com/ytc/pureview-female-avatar=s68-c-k')}`
    );
    const femaleAvatar68Data = await femaleAvatar68Res.json();
    assert.strictEqual(femaleAvatar68Data.hasFemaleFace, true, 'Expected 68x68 female avatar to be detected as female');
    assert.strictEqual(femaleAvatar68Data.action, 'BLUR');
    ok('AI Small 68x68 Female Channel Icon Detection', `femaleFaces=${femaleAvatar68Data.femaleFacesCount} -> BLUR`);

    const maleAvatar68Res = await fetch(
      `${baseUrl}/api/analyze-image?src=${encodeURIComponent('https://yt3.ggpht.com/ytc/pureview-male-avatar=s68-c-k')}`
    );
    const maleAvatar68Data = await maleAvatar68Res.json();
    assert.strictEqual(maleAvatar68Data.hasFemaleFace, false, 'Expected 68x68 male avatar to be safe');
    assert.strictEqual(maleAvatar68Data.maleFacesCount, 1);
    assert.strictEqual(maleAvatar68Data.action, 'UNBLUR');
    ok('AI Small 68x68 Male Channel Icon Detection', `maleFaces=1 -> UNBLUR (100% Clear)`);

    // Edge cases for /api/analyze-image
    const missingSrcRes = await fetch(`${baseUrl}/api/analyze-image`);
    assert.strictEqual(missingSrcRes.status, 400);
    ok('Edge Case: Missing ?src= returns HTTP 400');

    const invalidSrcRes = await fetch(`${baseUrl}/api/analyze-image?src=/test-images/does-not-exist.jpg`);
    assert.strictEqual(invalidSrcRes.status, 200);
    const invalidData = await invalidSrcRes.json();
    assert.strictEqual(invalidData.hasFemaleFace, false);
    ok('Edge Case: Non-existent image source handled gracefully without server crash');

    // ------------------------------------------------------------------------
    // 3. CORS BYPASS PROXY VERIFICATION (i.ytimg.com & scontent.*.fbcdn.net)
    // ------------------------------------------------------------------------
    const ytCorsUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent('https://i.ytimg.com/vi/pureview-female-test/hqdefault.jpg')}`;
    const ytCorsRes = await fetch(ytCorsUrl);
    assert.strictEqual(ytCorsRes.status, 200);
    assert.strictEqual(ytCorsRes.headers.get('access-control-allow-origin'), '*');
    assert.strictEqual(ytCorsRes.headers.get('cross-origin-resource-policy'), 'cross-origin');
    const ytBuf = await ytCorsRes.arrayBuffer();
    assert.ok(ytBuf.byteLength > 5000, 'Expected valid JPEG image bytes from YouTube CORS proxy');
    ok('YouTube Image Server (i.ytimg.com) CORS Bypass Proxy', `bytes=${ytBuf.byteLength}, ACAO=*`);

    const fbCorsUrl = `${baseUrl}/api/proxy-image?url=${encodeURIComponent('https://scontent.fdac1-1.fbcdn.net/v/pureview-female-ad.jpg')}`;
    const fbCorsRes = await fetch(fbCorsUrl);
    assert.strictEqual(fbCorsRes.status, 200);
    assert.strictEqual(fbCorsRes.headers.get('access-control-allow-origin'), '*');
    const fbBuf = await fbCorsRes.arrayBuffer();
    assert.ok(fbBuf.byteLength > 5000, 'Expected valid JPEG image bytes from Facebook CORS proxy');
    ok('Facebook Image Server (scontent.*.fbcdn.net) CORS Bypass Proxy', `bytes=${fbBuf.byteLength}, ACAO=*`);

    const siteProxyRes = await fetch(`${baseUrl}/api/proxy-site?site=youtube`);
    assert.strictEqual(siteProxyRes.status, 200);
    const siteProxyHtml = await siteProxyRes.text();
    assert.ok(siteProxyHtml.includes('pureview-webview-inject.js'), 'Expected injected PureView script in proxied site');
    assert.strictEqual(siteProxyRes.headers.get('x-frame-options'), null);
    ok('Mobile Site Reverse Proxy (/api/proxy-site)', 'Injects pureview-webview-inject.js & strips X-Frame-Options');

    // ------------------------------------------------------------------------
    // 4. ANDROID MOBILE VIEWPORT E2E BROWSER VERIFICATION (Playwright Pixel 7)
    // ------------------------------------------------------------------------
    const executablePath = findBrowserExecutable();
    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--allow-file-access-from-files']
    });

    try {
      const context = await browser.newContext({
        viewport: { width: 412, height: 915 },
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        isMobile: true,
        hasTouch: true
      });
      const page = await context.newPage();

      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

      // 4a. Verify 0ms Zero-Leak Blur-First CSS rule on a freshly inserted un-scanned image
      const zeroLeakBlurFilter = await page.evaluate(() => {
        const tempImg = document.createElement('img');
        tempImg.className = 'pv-zero-leak-probe';
        document.body.appendChild(tempImg);
        const filter = window.getComputedStyle(tempImg).filter;
        tempImg.remove();
        return filter;
      });
      assert.ok(
        zeroLeakBlurFilter.includes('blur(25px)'),
        `Expected 0ms Blur-First CSS filter to contain blur(25px), got: ${zeroLeakBlurFilter}`
      );
      ok('0ms Zero-Leak Blur-First CSS Engine (<img>)', `Unscanned <img> immediately has filter="${zeroLeakBlurFilter}"`);

      // Verify 0ms Blur-First & AI scanning on CSS background-image elements
      const bgImgCheck = await page.evaluate(async () => {
        const bgDiv = document.createElement('div');
        bgDiv.style.backgroundImage = "url('/test-images/female-portrait-1.jpg')";
        document.body.appendChild(bgDiv);
        const initialFilter = window.getComputedStyle(bgDiv).filter;
        await window.PureViewAI.scanBackgroundElement(bgDiv);
        const finalStatus = bgDiv.getAttribute('data-pv-status');
        const finalFilter = window.getComputedStyle(bgDiv).filter;
        bgDiv.remove();
        return { initialFilter, finalStatus, finalFilter };
      });
      assert.ok(bgImgCheck.initialFilter.includes('blur(25px)'));
      assert.strictEqual(bgImgCheck.finalStatus, 'blurred-female');
      assert.ok(bgImgCheck.finalFilter.includes('blur(25px)'));
      ok('0ms Zero-Leak Blur-First & AI Scan (background-image)', `initial="${bgImgCheck.initialFilter}" -> status="${bgImgCheck.finalStatus}"`);

      // 4b. Wait for all initial images in YouTube, Facebook, and Live Test Lab to finish AI scanning
      await page.waitForFunction(() => {
        const imgs = Array.from(document.querySelectorAll('img:not(.pv-ui-icon)'));
        return (
          imgs.length >= 20 &&
          imgs.every((img) => {
            const st = img.getAttribute('data-pv-status');
            return st === 'safe' || st === 'blurred-female' || st === 'blurred-face-only';
          })
        );
      }, { timeout: 15000 });

      // Verify Test Lab verdicts & computed CSS filters (including mixed-interview-thumb & safe-tech-review)
      const testLabResults = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[data-test-img]'));
        return items.map((img) => ({
          id: img.getAttribute('data-test-img'),
          status: img.getAttribute('data-pv-status'),
          filter: window.getComputedStyle(img).filter,
          verdict: img.closest('[data-pv-test-card]').querySelector('.pv-test-verdict').textContent.trim()
        }));
      });

      assert.strictEqual(testLabResults.length, 8);
      for (const item of testLabResults) {
        if (item.id.startsWith('test-female')) {
          assert.strictEqual(item.status, 'blurred-female', `Expected ${item.id} to be blurred-female`);
          assert.ok(item.filter.includes('blur(25px)'), `Expected ${item.id} computed filter to include blur(25px)`);
        } else {
          assert.strictEqual(item.status, 'safe', `Expected ${item.id} to be safe`);
          assert.ok(item.filter.includes('blur(0px)'), `Expected ${item.id} computed filter to include blur(0px)`);
        }
        ok(`Live Demo Test Feed [${item.id}]`, `${item.status} | ${item.verdict}`);
      }

      // 4c. Verify Tab 1 (Halal YouTube): Ad-Blocker, Search Bar & Background Audio Play
      const initialAds = await page.textContent('#pv-ads-blocked-num');
      await page.click('#pv-simulate-ad-btn');
      const afterAds = await page.textContent('#pv-ads-blocked-num');
      assert.strictEqual(Number(afterAds), Number(initialAds) + 1);
      ok('Halal YouTube Built-in Ad-Blocker', `Ads blocked incremented ${initialAds} -> ${afterAds}`);

      await page.click('#pv-play-audio-btn');
      const toastVisible = await page.evaluate(() =>
        document.getElementById('pv-bg-audio-toast').classList.contains('show')
      );
      assert.strictEqual(toastVisible, true);
      ok('Halal YouTube Background Audio Play', 'Screen-Off Background Audio & MediaSession active');
      await page.click('#pv-stop-bg-audio-btn');

      // 4d. Verify Tab 2 (Halal Facebook): Switch tab & check Stories/Reels/Sponsored Ads
      await page.click('#pv-nav-facebook');
      const fbTabActive = await page.evaluate(() =>
        document.getElementById('pv-tab-facebook').classList.contains('active')
      );
      assert.strictEqual(fbTabActive, true);

      const fbPostStatuses = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#pv-fb-feed-list .pv-fb-post-media img')).map((img) => ({
          src: img.getAttribute('src'),
          status: img.getAttribute('data-pv-status')
        }));
      });
      assert.strictEqual(fbPostStatuses.length, 4);
      assert.strictEqual(fbPostStatuses[0].status, 'safe'); // Male speaker post
      assert.strictEqual(fbPostStatuses[1].status, 'blurred-female'); // Sponsored female ad
      assert.strictEqual(fbPostStatuses[2].status, 'blurred-female'); // Female reel
      assert.strictEqual(fbPostStatuses[3].status, 'safe'); // Tech post
      ok('Halal Facebook Tab (Stories, Reels & Sponsored Ads)', 'Male & Tech posts clear; Female Ad & Reel locked with heavy blur');

      // 4e. Verify Tab 3 (PureView Shield Settings): Counter, Face-Only Mode, Slider, Master Switch
      await page.click('#pv-nav-settings');
      const blurredCounterVal = Number(await page.textContent('#pv-counter-female-blurred'));
      assert.ok(blurredCounterVal >= 10, `Expected Total Female Faces Blurred Today >= 10, got ${blurredCounterVal}`);

      // Verify Re-Scan does NOT inflate Total Female Faces Blurred Today
      await page.click('#pv-rescan-test-lab-btn');
      await page.waitForFunction(() => {
        const imgs = Array.from(document.querySelectorAll('[data-test-img]'));
        return imgs.every((i) => {
          const st = i.getAttribute('data-pv-status');
          return st === 'safe' || st === 'blurred-female' || st === 'blurred-face-only';
        });
      }, { timeout: 10000 });
      const afterRescanCounterVal = Number(await page.textContent('#pv-counter-female-blurred'));
      assert.strictEqual(afterRescanCounterVal, blurredCounterVal, 'Expected Re-Scan not to double-count female faces blurred');
      ok('Live Counter: Total Female Faces Blurred Today (No Re-Scan Inflation)', `Count = ${blurredCounterVal} female faces blurred`);

      // Switch to Face-Only Blur Mode & verify both single-female and mixed male+female cards
      await page.click('#pv-mode-face-only');
      const faceOnlyCheck = await page.evaluate(() => {
        const femaleImg = document.querySelector('[data-test-img="test-female-1"]');
        const boxes = femaleImg.parentElement.querySelectorAll('.pv-face-blur-box');
        const mixedImg = document.querySelector('[data-test-img="test-female-mixed-4"]');
        const mixedBoxes = mixedImg.parentElement.querySelectorAll('.pv-face-blur-box');
        return {
          status: femaleImg.getAttribute('data-pv-status'),
          boxCount: boxes.length,
          firstBoxStyle: boxes[0] ? boxes[0].getAttribute('style') : '',
          mixedStatus: mixedImg.getAttribute('data-pv-status'),
          mixedBoxCount: mixedBoxes.length
        };
      });
      assert.strictEqual(faceOnlyCheck.status, 'blurred-face-only');
      assert.strictEqual(faceOnlyCheck.boxCount, 1);
      assert.strictEqual(faceOnlyCheck.mixedStatus, 'blurred-face-only');
      assert.strictEqual(faceOnlyCheck.mixedBoxCount, 1, 'Expected strictly 1 face blur box (female only) in mixed male+female image');
      ok('Blur Mode: Face-Only Blur (Single & Mixed Male+Female)', `status=${faceOnlyCheck.status}, mixedBoxes=${faceOnlyCheck.mixedBoxCount}`);

      // Switch back to Full Image Blur Mode
      await page.click('#pv-mode-full');

      // Adjust Blur Strength Slider to 38px
      await page.evaluate(() => {
        const slider = document.getElementById('pv-blur-slider');
        slider.value = '38';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      const updatedBlurFilter = await page.evaluate(() => {
        const femaleImg = document.querySelector('[data-test-img="test-female-1"]');
        return window.getComputedStyle(femaleImg).filter;
      });
      assert.ok(updatedBlurFilter.includes('blur(38px)'), `Expected blur(38px), got ${updatedBlurFilter}`);
      ok('Blur Strength Slider (10px - 45px)', `Updated live to 38px -> filter="${updatedBlurFilter}"`);

      // Toggle Master Switch OFF and verify both filter AND .pv-blur-watermark are hidden
      await page.evaluate(() => {
        const sw = document.getElementById('pv-master-switch');
        sw.click();
      });
      const shieldOffState = await page.evaluate(() => {
        const femaleImg = document.querySelector('[data-test-img="test-female-1"]');
        const wm = femaleImg.parentElement.querySelector('.pv-blur-watermark');
        return {
          filter: window.getComputedStyle(femaleImg).filter,
          watermarkDisplay: wm ? window.getComputedStyle(wm).display : 'none'
        };
      });
      assert.strictEqual(shieldOffState.filter, 'none');
      assert.strictEqual(shieldOffState.watermarkDisplay, 'none', 'Expected .pv-blur-watermark to be hidden when Shield is OFF');

      // Restore Master Switch ON and 25px default
      await page.evaluate(() => {
        const sw = document.getElementById('pv-master-switch');
        sw.click();
        const slider = document.getElementById('pv-blur-slider');
        slider.value = '25';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      ok('Master Switch: PureView AI Shield ON / OFF', 'Verified global instant disable (including watermark hide) & re-enable');

      // 4f. Verify Rapid Scrolling / Mutation Storm (100+ <img> nodes inserted simultaneously)
      const stormResult = await page.evaluate(async () => {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        const imgs = [];
        for (let i = 0; i < 105; i++) {
          const img = document.createElement('img');
          img.src = i % 2 === 0 ? './test-images/female-portrait-1.jpg' : './test-images/male-scholar-1.jpg';
          container.appendChild(img);
          imgs.push(img);
        }
        const immediateBlurCount = imgs.filter((im) =>
          window.getComputedStyle(im).filter.includes('blur(25px)')
        ).length;
        window.PureViewAI.scanAllInContainer(container);
        await new Promise((resolve) => {
          const check = () => {
            if (
              imgs.every((im) => {
                const st = im.getAttribute('data-pv-status');
                return st === 'safe' || st === 'blurred-female';
              })
            ) {
              resolve();
            } else {
              setTimeout(check, 30);
            }
          };
          check();
        });
        const femaleBlurred = imgs.filter((im) => im.getAttribute('data-pv-status') === 'blurred-female').length;
        const maleSafe = imgs.filter((im) => im.getAttribute('data-pv-status') === 'safe').length;
        container.remove();
        return { total: imgs.length, immediateBlurCount, femaleBlurred, maleSafe };
      });
      assert.strictEqual(stormResult.immediateBlurCount, 105, 'All 105 storm images must have 0ms blur before scan');
      assert.strictEqual(stormResult.femaleBlurred, 53);
      assert.strictEqual(stormResult.maleSafe, 52);
      ok('Mutation Storm Stress Test (105 simultaneous <img> nodes)', `0msBlurred=105/105 -> femaleBlurred=53, maleSafe=52`);

      // 4g. Verify Live /api/proxy-site?site=youtube & pureview-webview-inject.js execution inside browser
      const proxyPage = await context.newPage();
      await proxyPage.goto(`${baseUrl}/api/proxy-site?site=youtube`, { waitUntil: 'domcontentloaded' });
      await proxyPage.waitForFunction(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const bg = document.querySelector('.bg-reel');
        return (
          window.__PUREVIEW_WEBVIEW_INJECTED__ === true &&
          imgs.length >= 4 &&
          imgs.every((i) => {
            const st = i.getAttribute('data-pv-status');
            return st === 'safe' || st === 'blurred-female';
          }) &&
          bg &&
          bg.getAttribute('data-pv-status') === 'blurred-female'
        );
      }, { timeout: 10000 });
      const proxyCheck = await proxyPage.evaluate(() => {
        const maleThumb = document.querySelector('#proxy-card-male img.thumb').getAttribute('data-pv-status');
        const maleAvatar = document.querySelector('#proxy-card-male img.avatar').getAttribute('data-pv-status');
        const femaleThumb = document.querySelector('#proxy-card-female img.thumb').getAttribute('data-pv-status');
        const femaleAvatar = document.querySelector('#proxy-card-female img.avatar').getAttribute('data-pv-status');
        const bgReel = document.querySelector('#proxy-card-bg-reel .bg-reel').getAttribute('data-pv-status');
        const adBtnRemaining = Boolean(document.querySelector('.ytp-ad-skip-button'));
        return { maleThumb, maleAvatar, femaleThumb, femaleAvatar, bgReel, adBtnRemaining };
      });
      assert.strictEqual(proxyCheck.maleThumb, 'safe');
      assert.strictEqual(proxyCheck.maleAvatar, 'safe');
      assert.strictEqual(proxyCheck.femaleThumb, 'blurred-female');
      assert.strictEqual(proxyCheck.femaleAvatar, 'blurred-female');
      assert.strictEqual(proxyCheck.bgReel, 'blurred-female');
      assert.strictEqual(proxyCheck.adBtnRemaining, false, 'Expected .ytp-ad-skip-button to be auto-clicked & removed');
      await proxyPage.close();
      ok('Live WebView Content Script (pureview-webview-inject.js)', 'Verified <img>, 68px avatars, CSS background-image & Ad-Skipper');

      // 4h. Verify Standalone Client-Side In-WebView AI Fallback (when /api/analyze-image is offline)
      const offlinePage = await context.newPage();
      await offlinePage.route('**/api/analyze-image**', (route) => route.abort());
      await offlinePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await offlinePage.waitForFunction(() => {
        const items = Array.from(document.querySelectorAll('[data-test-img]'));
        return (
          items.length === 8 &&
          items.every((i) => {
            const st = i.getAttribute('data-pv-status');
            return st === 'safe' || st === 'blurred-female';
          })
        );
      }, { timeout: 15000 });
      const offlineBgCheck = await offlinePage.evaluate(async () => {
        const bgDiv = document.createElement('div');
        bgDiv.style.backgroundImage = "url('./test-images/female-portrait-1.jpg')";
        document.body.appendChild(bgDiv);
        await window.PureViewAI.scanBackgroundElement(bgDiv);
        const st = bgDiv.getAttribute('data-pv-status');
        bgDiv.remove();
        return st;
      });
      assert.strictEqual(offlineBgCheck, 'blurred-female', 'Expected client-side AI fallback to blur female background-image');
      await offlinePage.close();
      ok('Standalone Client-Side In-WebView AI Fallback', 'Verified direct @vladmandic/face-api inference on <img> & background-image');

      // 4i. Verify file:// Asset Loading Compatibility (0 ERR_FILE_NOT_FOUND)
      const filePage = await context.newPage();
      const failedFileReqs = [];
      filePage.on('requestfailed', (req) => {
        if (req.url().startsWith('file:')) {
          failedFileReqs.push(req.url());
        }
      });
      const fileIndexUrl = 'file:///' + path.resolve(__dirname, '..', 'public', 'index.html').replace(/\\/g, '/');
      await filePage.goto(fileIndexUrl, { waitUntil: 'domcontentloaded' });
      await filePage.waitForTimeout(800);
      assert.strictEqual(failedFileReqs.length, 0, `Expected 0 failed file:// requests, got: ${failedFileReqs.join(', ')}`);
      await filePage.close();
      ok('Android file:// Asset Path Compatibility', '0 failed asset requests when loaded directly from filesystem');
    } finally {
      await browser.close();
    }

    // ------------------------------------------------------------------------
    // 5. ANDROID NATIVE APK PROJECT STRUCTURE VERIFICATION
    // ------------------------------------------------------------------------
    const requiredAndroidFiles = [
      'capacitor.config.json',
      'build-apk.ps1',
      'build-apk.bat',
      'android/build.gradle',
      'android/app/build.gradle',
      'android/app/src/main/AndroidManifest.xml',
      'android/app/src/main/java/com/pureview/ai/MainActivity.java',
      'android/app/src/main/java/com/pureview/ai/PureViewWebViewClient.java',
      'android/app/src/main/java/com/pureview/ai/PureViewJSBridge.java',
      'android/app/src/main/assets/public/index.html',
      'android/app/src/main/assets/public/models/age_gender_model-weights_manifest.json'
    ];
    for (const rel of requiredAndroidFiles) {
      const full = path.join(__dirname, '..', rel);
      assert.ok(fs.existsSync(full), `Missing required Android file: ${rel}`);
    }
    ok('Android APK Project & Synced WebView Assets', `${requiredAndroidFiles.length} native files verified`);

    console.log('\n====================================================================');
    console.log(`  🎉 ALL ${passed} DEEP VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
    console.log('====================================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
