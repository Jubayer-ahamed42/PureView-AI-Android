/**
 * ============================================================================
 * PureView AI — Android WebView & Reverse Proxy Content Script
 * Injected into m.youtube.com and m.facebook.com
 * ============================================================================
 * Features:
 * 1. 0ms Zero-Leak Blur-First CSS on all <img>, Shorts, Reels, Stories & CSS background-images
 * 2. Real Female-Face AI scanning with CORS-safe image proxy
 * 3. Built-in YouTube Ad-Blocker (Auto-Skip Video Ads + Hide Banner/Promoted Ads)
 * 4. Background Audio Play Keep-Alive (Screen-Off Playback for Quran, Nasheed & Lectures)
 */

(function () {
  if (window.__PUREVIEW_WEBVIEW_INJECTED__) return;
  window.__PUREVIEW_WEBVIEW_INJECTED__ = true;

  const PV_ORIGIN =
    document.currentScript && document.currentScript.src
      ? new URL(document.currentScript.src, window.location.href).origin
      : window.location.origin;

  // 1. Inject 0ms Zero-Leak Blur-First CSS immediately
  const style = document.createElement('style');
  style.id = 'pureview-webview-zero-leak-css';
  style.textContent = `
    img:not([data-pv-status="safe"]):not(.pv-ui-icon),
    ytm-thumbnail-cover:not([data-pv-status="safe"]),
    [style*="background-image"]:not([data-pv-status="safe"]):not(.pv-ui-icon) {
      filter: blur(25px) brightness(0.8) !important;
      transition: none !important;
    }
    img[data-pv-status="safe"],
    ytm-thumbnail-cover[data-pv-status="safe"],
    [style*="background-image"][data-pv-status="safe"] {
      filter: blur(0px) brightness(1) !important;
      transition: filter 0.2s ease-out !important;
    }
    img[data-pv-status="blurred-female"],
    ytm-thumbnail-cover[data-pv-status="blurred-female"],
    [style*="background-image"][data-pv-status="blurred-female"] {
      filter: blur(28px) brightness(0.7) !important;
      transition: none !important;
    }
    /* Hide YouTube Mobile & Facebook Ad Containers */
    ytm-promoted-sparkles-web-renderer,
    ytm-promoted-video-renderer,
    ytm-companion-ad-renderer,
    ytm-in-feed-ad-layout-renderer,
    .ytp-ad-overlay-container,
    .ytp-ad-message-container,
    [data-sigil*="sponsored"] {
      display: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  // 2. Background Audio Play: Prevent m.youtube.com from pausing when phone screen turns off
  try {
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    window.addEventListener(
      'visibilitychange',
      (e) => {
        e.stopImmediatePropagation();
      },
      true
    );
    window.addEventListener(
      'webkitvisibilitychange',
      (e) => {
        e.stopImmediatePropagation();
      },
      true
    );
  } catch (_) {}

  // 3. Built-in YouTube Video Ad-Blocker & Auto-Skipper
  function runYouTubeAdBlocker() {
    const skipSelectors = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-skip-ad-button',
      '.ytp-ad-overlay-close-button'
    ];
    for (const sel of skipSelectors) {
      const btn = document.querySelector(sel);
      if (btn && !btn.getAttribute('data-pv-ad-clicked')) {
        btn.setAttribute('data-pv-ad-clicked', '1');
        btn.click();
        btn.remove();
        notifyParent({ type: 'PV_AD_BLOCKED', count: 1 });
      }
    }

    const adPlayer = document.querySelector('.ad-showing video, .ad-interrupting video');
    if (adPlayer && Number.isFinite(adPlayer.duration) && adPlayer.duration > 0) {
      adPlayer.muted = true;
      adPlayer.currentTime = adPlayer.duration;
      notifyParent({ type: 'PV_AD_BLOCKED', count: 1 });
    }
  }

  setInterval(runYouTubeAdBlocker, 800);

  // 4. Scan images & CSS background-images via PureView AI Engine
  const scannedUrls = new Map();
  const inFlightUrls = new Map();

  async function analyzeUrl(src) {
    if (scannedUrls.has(src)) return scannedUrls.get(src);
    if (inFlightUrls.has(src)) return inFlightUrls.get(src);

    const p = (async () => {
      const resp = await fetch(`${PV_ORIGIN}/api/analyze-image?src=${encodeURIComponent(src)}`);
      if (resp.ok) {
        const data = await resp.json();
        scannedUrls.set(src, data);
        return data;
      }
      return null;
    })();
    inFlightUrls.set(src, p);
    try {
      return await p;
    } finally {
      inFlightUrls.delete(src);
    }
  }

  async function scanImg(img) {
    if (!img || img.classList.contains('pv-ui-icon')) return;
    const src = img.getAttribute('src') || img.currentSrc || img.getAttribute('data-src');
    if (!src || src.startsWith('data:image/svg')) {
      img.setAttribute('data-pv-status', 'safe');
      return;
    }
    if (img.getAttribute('data-pv-scanned-src') === src) return;
    img.setAttribute('data-pv-scanned-src', src);
    img.setAttribute('data-pv-status', 'scanning');

    try {
      const result = await analyzeUrl(src);
      if (result && result.hasFemaleFace) {
        img.setAttribute('data-pv-status', 'blurred-female');
        notifyParent({ type: 'PV_FEMALE_BLURRED', count: result.femaleFacesCount || 1 });
      } else {
        img.setAttribute('data-pv-status', 'safe');
      }
    } catch (_) {
      // Keep blurred if uncertain
    }
  }

  async function scanBgEl(el) {
    if (!el || el.classList.contains('pv-ui-icon')) return;
    const bgStyle = (el.style && el.style.backgroundImage) || el.getAttribute('style') || '';
    const match = bgStyle.match(/url\(['"]?([^'")]+)['"]?\)/i);
    const src = match ? match[1] : '';
    if (!src || src.startsWith('data:image/svg')) {
      el.setAttribute('data-pv-status', 'safe');
      return;
    }
    if (el.getAttribute('data-pv-scanned-src') === src) return;
    el.setAttribute('data-pv-scanned-src', src);
    el.setAttribute('data-pv-status', 'scanning');

    try {
      const result = await analyzeUrl(src);
      if (result && result.hasFemaleFace) {
        el.setAttribute('data-pv-status', 'blurred-female');
        notifyParent({ type: 'PV_FEMALE_BLURRED', count: result.femaleFacesCount || 1 });
      } else {
        el.setAttribute('data-pv-status', 'safe');
      }
    } catch (_) {}
  }

  function scanAll() {
    document.querySelectorAll('img:not(.pv-ui-icon)').forEach(scanImg);
    document
      .querySelectorAll('[style*="background-image"]:not(.pv-ui-icon), ytm-thumbnail-cover')
      .forEach(scanBgEl);
  }

  function notifyParent(payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
    } catch (_) {}
  }

  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.target) {
        if (m.target.tagName === 'IMG') {
          scanImg(m.target);
        } else {
          scanBgEl(m.target);
        }
      }
    }
    scanAll();
  });

  obs.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'style', 'data-src']
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanAll();
      runYouTubeAdBlocker();
    });
  } else {
    scanAll();
    runYouTubeAdBlocker();
  }
})();
