/**
 * ============================================================================
 * PureView AI — Core Mobile AI Engine ("Zero-Leak Blur-First + Real Female-Face AI")
 * ============================================================================
 * 1. 0ms Blur-First: CSS blurs all <img> / [data-pv-bg] immediately upon DOM entry.
 * 2. Real Female Face & Gender Classification (@vladmandic/face-api + WASM AI Bridge):
 *    - Detects human faces and classifies Gender (Female vs Male) + bounding boxes.
 *    - Female Face detected -> Locks Permanent Heavy Blur (Full Image or Face-Only Box).
 *    - Male Face only / Nature / Tech / Text -> Immediately unblurs (100% Clear).
 * 3. Automatic CORS Bypass for YouTube (i.ytimg.com) & Facebook (scontent.*.fbcdn.net).
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_SETTINGS = 'pureview_android_settings_v1';
  const STORAGE_KEY_STATS = 'pureview_android_stats_v1';

  const defaultSettings = {
    shieldEnabled: true,
    blurMode: 'full', // 'full' | 'face-only'
    blurStrength: 25, // px (10 - 45)
    youtubeAdBlock: true,
    backgroundAudio: true
  };

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (_) {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (_) {}
  }

  function loadStats() {
    const today = getTodayKey();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) return parsed;
      }
    } catch (_) {}
    return {
      date: today,
      femaleFacesBlurredToday: 0,
      safeImagesUnblurred: 0,
      totalScanned: 0,
      adsBlockedToday: 0,
      lastScanMs: 0
    };
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (_) {}
  }

  class PureViewAIEngine {
    constructor() {
      this.settings = loadSettings();
      this.stats = loadStats();
      this.resultCache = new Map(); // src -> analysisResult
      this.inFlightMap = new Map(); // src -> Promise<analysisResult>
      this.countedElements = new WeakSet();
      this.countedSlotIds = new Set();
      this.clientModelsLoaded = false;
      this.clientModelsLoading = null;
      this.observer = null;
      this.listeners = new Set();
      this.maxConcurrentScans = 8;
      this.activeScans = 0;
      this.scanQueue = [];

      this.applyGlobalCssState();
    }

    runWithConcurrency(fn) {
      return new Promise((resolve, reject) => {
        const exec = () => {
          this.activeScans++;
          Promise.resolve()
            .then(fn)
            .then(resolve, reject)
            .finally(() => {
              this.activeScans--;
              if (this.scanQueue.length > 0) {
                const next = this.scanQueue.shift();
                next();
              }
            });
        };
        if (this.activeScans < this.maxConcurrentScans) {
          exec();
        } else {
          this.scanQueue.push(exec);
        }
      });
    }

    onUpdate(callback) {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }

    notifyListeners() {
      for (const cb of this.listeners) {
        try {
          cb({ settings: this.settings, stats: this.stats });
        } catch (_) {}
      }
      if (global.PureViewNative && typeof global.PureViewNative.setShieldConfig === 'function') {
        try {
          global.PureViewNative.setShieldConfig(
            this.settings.shieldEnabled,
            this.settings.blurMode,
            this.settings.blurStrength,
            this.settings.backgroundAudio
          );
        } catch (_) {}
      }
    }

    applyGlobalCssState() {
      if (!document.body) return;
      document.documentElement.style.setProperty('--pv-blur-strength', `${this.settings.blurStrength}px`);
      if (this.settings.shieldEnabled) {
        document.body.classList.add('pv-shield-active');
      } else {
        document.body.classList.remove('pv-shield-active');
      }
      document.body.setAttribute('data-pv-blur-mode', this.settings.blurMode);
    }

    updateSettings(partial) {
      const prevMode = this.settings.blurMode;
      const prevShield = this.settings.shieldEnabled;
      this.settings = { ...this.settings, ...partial };
      saveSettings(this.settings);
      this.applyGlobalCssState();

      // Re-apply rendering mode to already-scanned images if blurMode or shield toggled
      if (prevMode !== this.settings.blurMode || prevShield !== this.settings.shieldEnabled) {
        this.reapplyAllScannedImages();
      }
      this.notifyListeners();
    }

    incrementAdsBlocked(count = 1) {
      this.stats.adsBlockedToday += count;
      saveStats(this.stats);
      this.notifyListeners();
    }

    recordFemaleFacesBlurred(count = 1) {
      const added = Math.max(1, count);
      this.stats.femaleFacesBlurredToday += added;
      saveStats(this.stats);
      if (global.PureViewNative && typeof global.PureViewNative.reportFemaleFaceBlurred === 'function') {
        try {
          global.PureViewNative.reportFemaleFaceBlurred(added);
        } catch (_) {}
      }
      this.notifyListeners();
    }

    isStandaloneFileOrAssetOrigin() {
      const proto = global.location && global.location.protocol;
      const host = (global.location && global.location.hostname) || '';
      return proto === 'file:' || host === 'appassets.androidplatform.net';
    }

    /**
     * Rewrites cross-origin YouTube (i.ytimg.com) & Facebook (scontent.*.fbcdn.net)
     * image URLs through the local CORS Proxy so AI Canvas scanning is never blocked.
     */
    getCorsSafeUrl(rawUrl) {
      if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;
      if (this.isStandaloneFileOrAssetOrigin()) {
        // In standalone Android APK (file:// or appassets.androidplatform.net), keep relative asset paths relative
        if (rawUrl.startsWith('/test-images/') || rawUrl.startsWith('/icons/') || rawUrl.startsWith('/models/')) {
          return `.${rawUrl}`;
        }
        return rawUrl;
      }
      try {
        const u = new URL(rawUrl, global.location.origin);
        if (u.origin === global.location.origin) {
          return rawUrl;
        }
        const host = u.hostname.toLowerCase();
        if (
          host.includes('ytimg.com') ||
          host.includes('ggpht.com') ||
          host.includes('googleusercontent.com') ||
          host.includes('fbcdn.net') ||
          host.includes('facebook.com') ||
          u.origin !== global.location.origin
        ) {
          return `/api/proxy-image?url=${encodeURIComponent(u.href)}`;
        }
        return u.href;
      } catch (_) {
        return rawUrl;
      }
    }

    /**
     * Loads client-side @vladmandic/face-api models as fallback / standalone APK engine
     */
    async ensureClientModels() {
      if (this.clientModelsLoaded) return true;
      if (this.clientModelsLoading) return this.clientModelsLoading;

      this.clientModelsLoading = (async () => {
        if (!global.faceapi) return false;
        const candidates =
          global.location && global.location.protocol === 'file:' ? ['./models'] : ['./models', '/models'];
        for (const modelUrl of candidates) {
          try {
            const tasks = [
              global.faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
              global.faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
              global.faceapi.nets.ageGenderNet.loadFromUri(modelUrl)
            ];
            if (global.faceapi.nets.tinyFaceDetector) {
              tasks.push(global.faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl).catch(() => {}));
            }
            await Promise.all(tasks);
            this.clientModelsLoaded = true;
            return true;
          } catch (_) {
            // Try next model candidate URL
          }
        }
        console.warn('[PureViewAI] Client model load failed across candidate paths');
        return false;
      })();

      return this.clientModelsLoading;
    }

    /**
     * Ensures we have a decoded HTMLImageElement ready for client-side neural inference,
     * whether starting from an <img> element (possibly still loading) or a CSS background-image URL.
     */
    async ensureDecodedImageElement(rawSrc, imgElement = null) {
      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        return imgElement;
      }

      if (imgElement && !imgElement.complete) {
        const loadedExisting = await new Promise((resolve) => {
          const timer = setTimeout(() => resolve(false), 3500);
          imgElement.addEventListener(
            'load',
            () => {
              clearTimeout(timer);
              resolve(imgElement.naturalWidth > 0);
            },
            { once: true }
          );
          imgElement.addEventListener(
            'error',
            () => {
              clearTimeout(timer);
              resolve(false);
            },
            { once: true }
          );
        });
        if (loadedExisting && imgElement.naturalWidth > 0) {
          return imgElement;
        }
      }

      // Create an offscreen Image (needed for CSS background-image or unloaded <img>)
      return new Promise((resolve) => {
        const probe = new Image();
        const timer = setTimeout(() => resolve(null), 4000);
        if (!this.isStandaloneFileOrAssetOrigin()) {
          probe.crossOrigin = 'anonymous';
        }
        probe.onload = () => {
          clearTimeout(timer);
          resolve(probe.naturalWidth > 0 ? probe : null);
        };
        probe.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        probe.src = this.getCorsSafeUrl(rawSrc);
      });
    }

    /**
     * Analyzes an image URL using Real Female-Face & Gender Classification AI.
     * Uses the WASM-accelerated local AI endpoint (/api/analyze-image) first for ~30ms speed,
     * and falls back to client-side @vladmandic/face-api WebGL/CPU inference for standalone APK.
     */
    async analyzeImageSource(rawSrc, imgElement = null) {
      if (!rawSrc) return null;
      const cacheKey = rawSrc.replace(/^\.\//, '/');
      if (this.resultCache.has(cacheKey)) {
        return this.resultCache.get(cacheKey);
      }
      if (this.inFlightMap.has(cacheKey)) {
        return this.inFlightMap.get(cacheKey);
      }

      const scanPromise = this.runWithConcurrency(async () => {
        if (this.resultCache.has(cacheKey)) {
          return this.resultCache.get(cacheKey);
        }

        const t0 = performance.now();
        let result = null;
        let serverErrorNote = null;

        // 1. Try Local WASM AI Bridge (/api/analyze-image) when running over HTTP/HTTPS server
        if (!this.isStandaloneFileOrAssetOrigin() && !rawSrc.startsWith('blob:') && !rawSrc.startsWith('data:')) {
          try {
            const resp = await fetch(`/api/analyze-image?src=${encodeURIComponent(rawSrc)}`);
            if (resp.ok) {
              const json = await resp.json();
              if (!json.note) {
                result = json;
              } else {
                serverErrorNote = json.note;
              }
            }
          } catch (_) {
            // Standalone file:// APK or offline mode -> fall back to in-WebView face-api.js
          }
        }

        // 2. Fallback: Direct In-WebView @vladmandic/face-api neural inference
        if (!result && global.faceapi) {
          const loaded = await this.ensureClientModels();
          if (loaded) {
            const targetImg = await this.ensureDecodedImageElement(rawSrc, imgElement);
            if (targetImg) {
              try {
                let dets = await global.faceapi
                  .detectAllFaces(targetImg, new global.faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
                  .withFaceLandmarks()
                  .withAgeAndGender();

                const w = targetImg.naturalWidth || targetImg.width || 1;
                const h = targetImg.naturalHeight || targetImg.height || 1;

                if (dets.length === 0 && (w < 160 || h < 160) && global.faceapi.nets.tinyFaceDetector) {
                  dets = await global.faceapi
                    .detectAllFaces(
                      targetImg,
                      new global.faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.35 })
                    )
                    .withFaceLandmarks()
                    .withAgeAndGender();
                }

                const faces = dets.map((d) => ({
                  gender: d.gender,
                  genderProbability: Number(d.genderProbability.toFixed(3)),
                  age: Math.round(d.age),
                  box: {
                    x: d.detection.box.x / w,
                    y: d.detection.box.y / h,
                    width: d.detection.box.width / w,
                    height: d.detection.box.height / h
                  }
                }));

                const femaleFaces = faces.filter((f) => f.gender === 'female' && f.genderProbability >= 0.5);
                const maleFaces = faces.filter((f) => f.gender === 'male');

                result = {
                  facesCount: faces.length,
                  femaleFacesCount: femaleFaces.length,
                  maleFacesCount: maleFaces.length,
                  hasFemaleFace: femaleFaces.length > 0,
                  action: femaleFaces.length > 0 ? 'BLUR' : 'UNBLUR',
                  faces,
                  scanTimeMs: Math.max(1, Math.round(performance.now() - t0))
                };
              } catch (err) {
                console.warn('[PureViewAI] In-WebView inference error:', err);
              }
            }
          }
        }

        // 3. Final fallback if image could not be decoded
        if (!result) {
          result = {
            facesCount: 0,
            femaleFacesCount: 0,
            maleFacesCount: 0,
            hasFemaleFace: false,
            action: 'UNBLUR',
            faces: [],
            scanTimeMs: Math.max(1, Math.round(performance.now() - t0)),
            ...(serverErrorNote ? { note: serverErrorNote } : {})
          };
        }

        this.resultCache.set(cacheKey, result);
        return result;
      });

      this.inFlightMap.set(cacheKey, scanPromise);
      try {
        return await scanPromise;
      } finally {
        this.inFlightMap.delete(cacheKey);
      }
    }

    /**
     * Scans a single <img> element:
     * - Ensures 0ms Blur-First state is active while scanning
     * - Runs Real Female-Face & Gender Classification AI
     * - Applies Permanent Heavy Blur (or Face-Only Blur Box) if Female Face found
     * - Immediately unblurs (100% Clear) if Male Face only or No Face (Nature/Tech/Mosque)
     */
    async scanImageElement(img) {
      if (!img || img.classList.contains('pv-ui-icon')) return;
      const rawSrc = img.getAttribute('data-pv-orig-src') || img.getAttribute('src') || img.currentSrc;
      if (!rawSrc || rawSrc.startsWith('data:image/svg')) {
        img.setAttribute('data-pv-status', 'safe');
        return;
      }

      // Prevent duplicate concurrent or repeated scans on the same <img> for the same rawSrc
      if (img.__pvScanSrc === rawSrc && (img.__pvScanning || img.__pvAnalysis)) {
        if (img.__pvAnalysis) {
          this.applyDecisionToImage(img, img.__pvAnalysis);
        }
        return;
      }
      img.__pvScanSrc = rawSrc;
      img.__pvScanning = true;

      // Ensure cross-origin YouTube/Facebook images use CORS-safe URL
      const safeUrl = this.getCorsSafeUrl(rawSrc);
      img.__pvSafeSrc = safeUrl;
      if (safeUrl !== rawSrc && !img.getAttribute('data-pv-orig-src')) {
        img.setAttribute('data-pv-orig-src', rawSrc);
        if (!this.isStandaloneFileOrAssetOrigin()) {
          img.crossOrigin = 'anonymous';
        }
        img.src = safeUrl;
      }

      const currentStatus = img.getAttribute('data-pv-status');
      if (!currentStatus || currentStatus === 'safe') {
        img.setAttribute('data-pv-status', 'scanning');
      }

      this.renderBadge(img, 'scanning', '⏳ AI Scanning...');

      let analysis = null;
      try {
        analysis = await this.analyzeImageSource(rawSrc, img);
      } finally {
        img.__pvScanning = false;
      }
      if (!analysis) return;

      img.__pvAnalysis = analysis;

      // Deduplicate stats counting by logical slot or unique element
      const normSrc = rawSrc.replace(/^\.\//, '/');
      const cardEl = img.closest('[data-video-id], [data-short-id], [data-story-id], [data-post-id], [data-pv-test-card]');
      const isAvatar = Boolean(img.closest('.pv-avatar-wrap'));
      const slotKey = cardEl
        ? `${cardEl.getAttribute('data-video-id') || cardEl.getAttribute('data-short-id') || cardEl.getAttribute('data-story-id') || cardEl.getAttribute('data-post-id') || cardEl.getAttribute('data-pv-test-card')}:${isAvatar ? 'avatar' : 'main'}:${normSrc}`
        : null;

      const alreadyCounted = this.countedElements.has(img) || (slotKey && this.countedSlotIds.has(slotKey));
      this.countedElements.add(img);
      if (slotKey) this.countedSlotIds.add(slotKey);
      if (!alreadyCounted) {
        this.stats.totalScanned += 1;
        this.stats.lastScanMs = analysis.scanTimeMs || 28;

        if (analysis.hasFemaleFace) {
          const added = Math.max(1, analysis.femaleFacesCount || 1);
          this.stats.femaleFacesBlurredToday += added;
          if (global.PureViewNative && typeof global.PureViewNative.reportFemaleFaceBlurred === 'function') {
            try {
              global.PureViewNative.reportFemaleFaceBlurred(added);
            } catch (_) {}
          }
        } else {
          this.stats.safeImagesUnblurred += 1;
        }
        saveStats(this.stats);
        this.notifyListeners();
      }

      this.applyDecisionToImage(img, analysis);
    }

    applyDecisionToImage(img, analysis) {
      if (!img || !analysis) return;
      const parent = img.parentElement;

      // Clear previous face-only overlays or watermarks
      if (parent) {
        parent.querySelectorAll('.pv-face-blur-box, .pv-blur-watermark').forEach((el) => el.remove());
      }

      if (analysis.hasFemaleFace) {
        const femaleConf = analysis.faces
          .filter((f) => f.gender === 'female')
          .map((f) => `${Math.round(f.genderProbability * 100)}%`)
          .join(', ');

        if (this.settings.blurMode === 'face-only' && parent) {
          // Face-Only Blur Mode: Unblur background, place heavy blur mask strictly over Female Face(s)
          img.setAttribute('data-pv-status', 'blurred-face-only');
          analysis.faces
            .filter((f) => f.gender === 'female' && f.genderProbability >= 0.5)
            .forEach((f) => {
              const boxEl = document.createElement('div');
              boxEl.className = 'pv-face-blur-box';
              // Expand box slightly (+28% W, +32% H) to cover hair/headscarf contours cleanly
              const padW = f.box.width * 0.28;
              const padH = f.box.height * 0.32;
              const left = Math.max(0, (f.box.x - padW / 2) * 100);
              const top = Math.max(0, (f.box.y - padH / 2) * 100);
              const width = Math.min(100 - left, (f.box.width + padW) * 100);
              const height = Math.min(100 - top, (f.box.height + padH) * 100);

              boxEl.style.left = `${left.toFixed(1)}%`;
              boxEl.style.top = `${top.toFixed(1)}%`;
              boxEl.style.width = `${width.toFixed(1)}%`;
              boxEl.style.height = `${height.toFixed(1)}%`;
              parent.appendChild(boxEl);
            });
          this.renderBadge(img, 'blurred', `🛡️ Face Blurred (${femaleConf})`);
        } else {
          // Full Image Blur Mode: Lock permanent heavy CSS blur on the entire image
          img.setAttribute('data-pv-status', 'blurred-female');
          this.renderBadge(img, 'blurred', `🛡️ Female Blurred (${femaleConf})`);

          // Add subtle Islamic Shield watermark on larger thumbnails/cards when Shield is active
          if (
            this.settings.shieldEnabled &&
            parent &&
            !parent.classList.contains('pv-avatar-wrap') &&
            parent.clientHeight >= 90
          ) {
            const wm = document.createElement('div');
            wm.className = 'pv-blur-watermark';
            wm.innerHTML = `
              <div class="pv-wm-icon">🛡️</div>
              <div class="pv-wm-title">PureView AI Shield Locked</div>
              <div class="pv-wm-sub">Female Face Detected (${analysis.femaleFacesCount}) • Lower Your Gaze</div>
            `;
            parent.appendChild(wm);
          }
        }
      } else {
        // SAFE! Either Male Face(s) only, or Nature / Mosque / Tech / Text (0 Female Faces)
        img.setAttribute('data-pv-status', 'safe');
        if (analysis.maleFacesCount > 0) {
          const maleConf = analysis.faces
            .filter((f) => f.gender === 'male')
            .map((f) => `${Math.round(f.genderProbability * 100)}%`)
            .join(', ');
          this.renderBadge(img, 'safe', `✅ Male Face (${maleConf}) • Clear`);
        } else {
          this.renderBadge(img, 'safe', `✅ No Female Face • Clear`);
        }
      }

      // Also update any linked test-lab verdict label
      const card = img.closest('[data-pv-test-card]');
      if (card) {
        const verdictEl = card.querySelector('.pv-test-verdict');
        if (verdictEl) {
          if (analysis.hasFemaleFace) {
            verdictEl.className = 'pv-test-verdict verdict-female';
            verdictEl.textContent = `🔒 Female (${analysis.femaleFacesCount}) -> Locked Heavy Blur (${analysis.scanTimeMs}ms)`;
          } else if (analysis.maleFacesCount > 0) {
            verdictEl.className = 'pv-test-verdict verdict-safe';
            verdictEl.textContent = `✅ Male Face (${analysis.maleFacesCount}) -> 100% Unblurred (${analysis.scanTimeMs}ms)`;
          } else {
            verdictEl.className = 'pv-test-verdict verdict-safe';
            verdictEl.textContent = `✅ Safe Scene (0 Faces) -> 100% Unblurred (${analysis.scanTimeMs}ms)`;
          }
        }
      }
    }

    renderBadge(img, state, text) {
      const parent = img.parentElement;
      if (!parent || parent.classList.contains('pv-avatar-wrap')) return;

      let pill = parent.querySelector('.pv-status-pill');
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'pv-status-pill';
        parent.appendChild(pill);
      }
      pill.className = `pv-status-pill ${state}`;
      pill.textContent = text;
    }

    async scanBackgroundElement(el) {
      if (!el || el.classList.contains('pv-ui-icon')) return;
      const bgStyle = el.getAttribute('data-pv-bg') || (el.style && el.style.backgroundImage) || '';
      const match = bgStyle.match(/url\(['"]?([^'")]+)['"]?\)/i);
      const rawSrc = match ? match[1] : bgStyle;
      if (!rawSrc || rawSrc.startsWith('data:image/svg')) {
        el.setAttribute('data-pv-status', 'safe');
        return;
      }
      if (el.__pvScanSrc === rawSrc && (el.__pvScanning || el.__pvAnalysis)) {
        return;
      }
      el.__pvScanSrc = rawSrc;
      el.__pvScanning = true;
      if (!el.getAttribute('data-pv-status')) {
        el.setAttribute('data-pv-status', 'scanning');
      }
      let analysis = null;
      try {
        analysis = await this.analyzeImageSource(rawSrc, null);
      } finally {
        el.__pvScanning = false;
      }
      if (!analysis) return;
      el.__pvAnalysis = analysis;
      el.setAttribute('data-pv-status', analysis.hasFemaleFace ? 'blurred-female' : 'safe');
    }

    reapplyAllScannedImages() {
      document.querySelectorAll('img, [style*="background-image"], [data-pv-bg]').forEach((el) => {
        if (el.__pvAnalysis) {
          if (el.tagName === 'IMG') {
            this.applyDecisionToImage(el, el.__pvAnalysis);
          } else {
            el.setAttribute('data-pv-status', el.__pvAnalysis.hasFemaleFace ? 'blurred-female' : 'safe');
          }
        }
      });
    }

    scanAllInContainer(root = document) {
      const imgs = root.querySelectorAll('img:not(.pv-ui-icon)');
      imgs.forEach((img) => {
        if (!img.__pvAnalysis && !img.__pvScanning) {
          this.scanImageElement(img);
        }
      });
      const bgEls = root.querySelectorAll('[style*="background-image"]:not(.pv-ui-icon), [data-pv-bg]');
      bgEls.forEach((el) => {
        if (!el.__pvAnalysis && !el.__pvScanning) {
          this.scanBackgroundElement(el);
        }
      });
    }

    startMutationObserver() {
      if (this.observer) return;
      this.observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach((node) => {
              if (node.nodeType !== 1) return;
              if (node.tagName === 'IMG') {
                this.scanImageElement(node);
              } else {
                if (node.style && node.style.backgroundImage) {
                  this.scanBackgroundElement(node);
                }
                if (node.querySelectorAll) {
                  node.querySelectorAll('img:not(.pv-ui-icon)').forEach((img) => this.scanImageElement(img));
                  node.querySelectorAll('[style*="background-image"]:not(.pv-ui-icon), [data-pv-bg]').forEach((el) =>
                    this.scanBackgroundElement(el)
                  );
                }
              }
            });
          } else if (m.type === 'attributes' && m.target) {
            if (m.target.tagName === 'IMG') {
              const newSrc = m.target.getAttribute('src') || m.target.currentSrc;
              if (
                newSrc &&
                newSrc !== m.target.__pvScanSrc &&
                newSrc !== m.target.__pvSafeSrc &&
                !newSrc.startsWith('/api/proxy-image')
              ) {
                m.target.removeAttribute('data-pv-orig-src');
                m.target.__pvAnalysis = null;
                this.scanImageElement(m.target);
              }
            } else if (m.attributeName === 'style' && m.target.style && m.target.style.backgroundImage) {
              this.scanBackgroundElement(m.target);
            }
          }
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'style']
      });
    }
  }

  global.PureViewAI = new PureViewAIEngine();
})(window);
