/**
 * ============================================================================
 * PureView AI — Android Super-App UI Controller (3 Core Tabs + Live Test Lab)
 * ============================================================================
 */

(function () {
  'use strict';

  const YOUTUBE_SHORTS = [
    {
      id: 'yt-short-1',
      title: 'রমজানের প্রস্তুতি ও তাকওয়া • Islamic Reminder #Shorts',
      views: '142K views',
      thumb: './test-images/male-scholar-1.jpg',
      category: 'islamic'
    },
    {
      id: 'yt-short-2',
      title: 'Trending Fashion & Lifestyle Reel #Shorts',
      views: '890K views',
      thumb: './test-images/female-reel-4.jpg',
      category: 'shorts'
    }
  ];

  const YOUTUBE_VIDEOS = [
    {
      id: 'yt-vid-1',
      title: 'Surah Ar-Rahman Full Heart Soothing Recitation | সূরা আর-রহমান তেলাওয়াত',
      channel: 'Al-Quran Merciful Servant',
      views: '2.4M views • 2 days ago',
      duration: '14:28',
      thumb: './test-images/safe-mosque-nature.jpg',
      avatar: './test-images/male-scholar-1.jpg',
      category: 'islamic'
    },
    {
      id: 'yt-vid-2',
      title: 'Celebrity Glamour & Fashion Vlog Episode 14 | Daily Routine',
      channel: 'Glitz & Style Studio',
      views: '610K views • 5 hours ago',
      duration: '11:05',
      thumb: './test-images/female-yt-thumb-3.jpg',
      avatar: './test-images/female-portrait-1.jpg',
      category: 'all'
    },
    {
      id: 'yt-vid-3',
      title: 'যুবকদের ঈমান ও চোখের হেফাজত — বিশেষ ইসলামিক পডকাস্ট | Halal Podcast',
      channel: 'PureDeen Bangla',
      views: '530K views • 1 day ago',
      duration: '42:19',
      thumb: './test-images/male-podcast-thumb.jpg',
      avatar: './test-images/male-speaker-2.jpg',
      category: 'islamic'
    },
    {
      id: 'yt-vid-4',
      title: 'Summer Model Photoshoot & Beauty Brand Commercial 2026',
      channel: 'Vogue Trends Official',
      views: '1.1M views • 3 days ago',
      duration: '08:44',
      thumb: './test-images/female-vlog-2.jpg',
      avatar: './test-images/female-vlog-2.jpg',
      category: 'all'
    },
    {
      id: 'yt-vid-5',
      title: 'Android AI App Architecture & Mobile Neural Networks Full Tutorial',
      channel: 'Halal Coders BD',
      views: '95K views • 6 hours ago',
      duration: '29:10',
      thumb: './test-images/safe-tech-review.jpg',
      avatar: './test-images/male-scholar-1.jpg',
      category: 'tech'
    }
  ];

  const FACEBOOK_STORIES = [
    {
      id: 'fb-story-1',
      author: 'Shaykh Ahmad',
      thumb: './test-images/male-scholar-1.jpg'
    },
    {
      id: 'fb-story-2',
      author: 'Nadia Lifestyle',
      thumb: './test-images/female-portrait-1.jpg'
    },
    {
      id: 'fb-story-3',
      author: 'Haramain Info',
      thumb: './test-images/safe-mosque-nature.jpg'
    },
    {
      id: 'fb-story-4',
      author: 'Glow Cosmetics',
      thumb: './test-images/female-ad-5.jpg'
    }
  ];

  const FACEBOOK_POSTS = [
    {
      id: 'fb-post-1',
      author: 'Islamic Dawah Circle Bangladesh',
      meta: '25 mins ago • 🌍 Public',
      avatar: './test-images/male-scholar-1.jpg',
      text: 'আলহামদুলিল্লাহ! সোশ্যাল মিডিয়া ব্যবহারের সময় চোখের হেফাজত করা মুমিনের অন্যতম বৈশিষ্ট্য। আমাদের নতুন ইসলামিক লেকচার সিরিজ দেখুন।',
      media: './test-images/male-speaker-2.jpg',
      likes: '4.8K',
      comments: '312 Comments'
    },
    {
      id: 'fb-post-2',
      author: 'Aura Fashion & Beauty World',
      meta: 'Sponsored • 🌐 scontent.fdac1-1.fbcdn.net',
      avatar: './test-images/female-portrait-1.jpg',
      text: '✨ Exclusive Summer Western & Party Collection 2026! Flat 40% Discount for Today Only. Tap to Shop Now!',
      media: './test-images/female-ad-5.jpg',
      likes: '1.2K',
      comments: '89 Comments'
    },
    {
      id: 'fb-post-3',
      author: 'Viral Reels & Shorts Hub',
      meta: 'Suggested Reel for You • 🎬 Reels',
      avatar: './test-images/female-vlog-2.jpg',
      text: 'Weekend Dance & Makeover Reel Challenge 🔥 #Reels #Trending',
      media: './test-images/female-reel-4.jpg',
      likes: '19K',
      comments: '1.4K Comments'
    },
    {
      id: 'fb-post-4',
      author: 'Muslim Software Engineers Community',
      meta: '1 hr ago • 🌍 Public',
      avatar: './test-images/male-speaker-2.jpg',
      text: 'অ্যান্ড্রয়েড মোবাইলের জন্য অফলাইন এআই এবং ওয়েবভিউ অপটিমাইজেশন নিয়ে আজকের ওয়ার্কশপের স্লাইড।',
      media: './test-images/safe-tech-review.jpg',
      likes: '920',
      comments: '74 Comments'
    }
  ];

  const TEST_LAB_ITEMS = [
    {
      id: 'test-male-1',
      title: 'Male Scholar Portrait',
      expected: 'Male Face -> Unblur (Clear)',
      src: './test-images/male-scholar-1.jpg'
    },
    {
      id: 'test-female-1',
      title: 'Female Portrait (Normal Attire)',
      expected: 'Female Face -> Permanent Blur',
      src: './test-images/female-portrait-1.jpg'
    },
    {
      id: 'test-male-2',
      title: 'Male Speaker Portrait',
      expected: 'Male Face -> Unblur (Clear)',
      src: './test-images/male-speaker-2.jpg'
    },
    {
      id: 'test-female-2',
      title: 'Female Vlog / Reel Model',
      expected: 'Female Face -> Permanent Blur',
      src: './test-images/female-vlog-2.jpg'
    },
    {
      id: 'test-safe-mosque',
      title: 'Mosque & Nature (No Face)',
      expected: '0 Faces -> Unblur (Clear)',
      src: './test-images/safe-mosque-nature.jpg'
    },
    {
      id: 'test-female-3',
      title: 'Multi-Female YouTube Thumb',
      expected: '3 Female Faces -> Permanent Blur',
      src: './test-images/female-yt-thumb-3.jpg'
    },
    {
      id: 'test-female-mixed-4',
      title: 'Mixed Male + Female Interview',
      expected: '1 Male + 1 Female -> Blur Female',
      src: './test-images/mixed-interview-thumb.jpg'
    },
    {
      id: 'test-safe-tech',
      title: 'Tech & Coding Slide (No Face)',
      expected: '0 Faces -> Unblur (Clear)',
      src: './test-images/safe-tech-review.jpg'
    }
  ];

  // Background Audio Engine (Web Audio API soothing Islamic drone/chime + MediaSession + WakeLock)
  let audioCtx = null;
  let audioOsc = null;
  let audioGain = null;
  let isAudioPlaying = false;
  let wakeLockSentinel = null;

  async function toggleBackgroundAudioPlayback(forceState) {
    const nextState = typeof forceState === 'boolean' ? forceState : !isAudioPlaying;
    const playBtn = document.getElementById('pv-play-audio-btn');
    const toast = document.getElementById('pv-bg-audio-toast');
    const statusText = document.getElementById('pv-now-playing-status');

    if (nextState) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          if (!audioCtx) audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') await audioCtx.resume();
          if (!audioOsc) {
            audioOsc = audioCtx.createOscillator();
            audioGain = audioCtx.createGain();
            audioOsc.type = 'sine';
            audioOsc.frequency.setValueAtTime(432, audioCtx.currentTime);
            audioGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
            audioOsc.connect(audioGain);
            audioGain.connect(audioCtx.destination);
            audioOsc.start();
          }
        }
      } catch (_) {}

      // Register Android Lock-Screen MediaSession controls
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Surah Ar-Rahman — Heart Soothing Recitation',
            artist: 'Mishary Rashid Alafasy',
            album: 'PureView Halal YouTube Background Audio'
          });
          navigator.mediaSession.setActionHandler('play', () => toggleBackgroundAudioPlayback(true));
          navigator.mediaSession.setActionHandler('pause', () => toggleBackgroundAudioPlayback(false));
        } catch (_) {}
      }

      // Request Android Screen WakeLock if available
      if ('wakeLock' in navigator && navigator.wakeLock) {
        try {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        } catch (_) {}
      }

      isAudioPlaying = true;
      if (playBtn) playBtn.textContent = '⏸️ Pause Tilawat (Background Active)';
      if (toast) toast.classList.add('show');
      if (statusText) {
        statusText.textContent = '🔊 Playing in Background Mode • Safe to Lock Android Screen';
      }
    } else {
      if (audioOsc) {
        try {
          audioOsc.stop();
          audioOsc.disconnect();
        } catch (_) {}
        audioOsc = null;
      }
      if (wakeLockSentinel) {
        try {
          await wakeLockSentinel.release();
        } catch (_) {}
        wakeLockSentinel = null;
      }
      isAudioPlaying = false;
      if (playBtn) playBtn.textContent = '▶️ Play Tilawat (Screen-Off Audio)';
      if (toast) toast.classList.remove('show');
      if (statusText) {
        statusText.textContent = 'Halal YouTube Player • Ad-Blocker Active • Background Audio Ready';
      }
    }
  }

  let currentYtFilter = 'all';
  let currentYtSearch = '';

  function renderYouTubeFeed(filter = currentYtFilter, searchQuery = currentYtSearch) {
    currentYtFilter = filter;
    currentYtSearch = searchQuery;
    const shortsContainer = document.getElementById('pv-yt-shorts-list');
    const feedContainer = document.getElementById('pv-yt-feed-list');
    if (!shortsContainer || !feedContainer) return;

    const cleanSearch = (searchQuery || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(m\.|www\.)?youtube\.com\/?/i, '');

    shortsContainer.innerHTML = YOUTUBE_SHORTS.map(
      (s) => `
      <div class="pv-short-card pv-media-wrapper" data-short-id="${s.id}">
        <img src="${s.thumb}" alt="${s.title}" />
        <div class="pv-short-caption">
          <div>${s.title}</div>
          <div style="font-size:10px; color:#a7f3d0; margin-top:2px;">${s.views}</div>
        </div>
      </div>
    `
    ).join('');

    let filteredVideos =
      filter === 'all' || filter === 'shorts'
        ? YOUTUBE_VIDEOS
        : YOUTUBE_VIDEOS.filter((v) => v.category === filter);

    if (cleanSearch) {
      filteredVideos = filteredVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(cleanSearch) ||
          v.channel.toLowerCase().includes(cleanSearch) ||
          v.category.toLowerCase().includes(cleanSearch)
      );
    }

    feedContainer.innerHTML = filteredVideos
      .map(
        (v) => `
      <article class="pv-yt-card" data-video-id="${v.id}" style="cursor:pointer;">
        <div class="pv-yt-thumb-wrap pv-media-wrapper">
          <img src="${v.thumb}" alt="${v.title}" />
          <span class="pv-yt-duration">${v.duration}</span>
        </div>
        <div class="pv-yt-meta">
          <div class="pv-avatar-wrap">
            <img src="${v.avatar}" alt="${v.channel}" />
          </div>
          <div class="pv-yt-info">
            <h3 class="pv-yt-title">${v.title}</h3>
            <div class="pv-yt-sub">
              <span>${v.channel}</span> • <span>${v.views}</span>
            </div>
          </div>
        </div>
      </article>
    `
      )
      .join('');

    feedContainer.querySelectorAll('.pv-yt-card').forEach((card) => {
      card.addEventListener('click', () => {
        const vidId = card.getAttribute('data-video-id');
        const vid = YOUTUBE_VIDEOS.find((v) => v.id === vidId);
        if (!vid) return;
        const thumbImg = card.querySelector('.pv-yt-thumb-wrap img');
        const status = thumbImg ? thumbImg.getAttribute('data-pv-status') : '';
        const titleEl = document.getElementById('pv-now-playing-title');
        const statusEl = document.getElementById('pv-now-playing-status');
        if (status === 'blurred-female' && window.PureViewAI.settings.shieldEnabled) {
          if (statusEl) {
            statusEl.textContent = '🛡️ PureView AI Shield: Female video blocked to protect your gaze.';
          }
          return;
        }
        if (titleEl) titleEl.textContent = `${vid.title} — ${vid.channel}`;
        if (statusEl) statusEl.textContent = `▶️ Now Playing (${vid.duration}) • Ad-Blocker Active • Background Audio Ready`;
      });
    });

    window.PureViewAI.scanAllInContainer(shortsContainer);
    window.PureViewAI.scanAllInContainer(feedContainer);
  }

  function renderFacebookFeed() {
    const storiesEl = document.getElementById('pv-fb-stories-list');
    const postsEl = document.getElementById('pv-fb-feed-list');
    if (!storiesEl || !postsEl) return;

    storiesEl.innerHTML = FACEBOOK_STORIES.map(
      (s) => `
      <div class="pv-story-card pv-media-wrapper" data-story-id="${s.id}">
        <img src="${s.thumb}" alt="${s.author}" />
        <div class="pv-story-label">${s.author}</div>
      </div>
    `
    ).join('');

    postsEl.innerHTML = FACEBOOK_POSTS.map(
      (p) => `
      <article class="pv-fb-post" data-post-id="${p.id}">
        <div class="pv-fb-post-header">
          <div class="pv-avatar-wrap">
            <img src="${p.avatar}" alt="${p.author}" />
          </div>
          <div class="pv-fb-author">
            <h4>${p.author}</h4>
            <span>${p.meta}</span>
          </div>
        </div>
        <div class="pv-fb-post-text">${p.text}</div>
        <div class="pv-fb-post-media pv-media-wrapper">
          <img src="${p.media}" alt="${p.author}" />
        </div>
        <div class="pv-fb-actions">
          <span>👍 Like (${p.likes})</span>
          <span>💬 ${p.comments}</span>
          <span>↗️ Share</span>
        </div>
      </article>
    `
    ).join('');

    window.PureViewAI.scanAllInContainer(storiesEl);
    window.PureViewAI.scanAllInContainer(postsEl);
  }

  function renderTestLab() {
    const grid = document.getElementById('pv-test-lab-grid');
    if (!grid) return;

    grid.innerHTML = TEST_LAB_ITEMS.map(
      (item) => `
      <div class="pv-test-card" data-pv-test-card="${item.id}">
        <div class="pv-test-img-box pv-media-wrapper">
          <img src="${item.src}" alt="${item.title}" data-test-img="${item.id}" />
        </div>
        <div class="pv-test-card-body">
          <h5>${item.title}</h5>
          <div style="font-size:10.5px; color:#a7f3d0;">Expected: ${item.expected}</div>
          <div class="pv-test-verdict">⏳ AI Scanning...</div>
        </div>
      </div>
    `
    ).join('');

    window.PureViewAI.scanAllInContainer(grid);
  }

  function switchTab(targetTab) {
    document.querySelectorAll('.pv-tab-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.getAttribute('data-tab') === targetTab);
    });
    document.querySelectorAll('.pv-nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-nav-target') === targetTab);
    });
    const vp = document.getElementById('pv-main-viewport');
    if (vp) vp.scrollTop = 0;
  }

  function syncSettingsUI() {
    const { settings, stats } = window.PureViewAI;

    // Header pill
    const headerText = document.getElementById('pv-header-shield-text');
    if (headerText) {
      headerText.textContent = settings.shieldEnabled ? 'Shield: ON' : 'Shield: OFF';
    }

    // Quick stats strip
    const stripBlurred = document.getElementById('pv-strip-blurred-count');
    const stripSafe = document.getElementById('pv-strip-safe-count');
    if (stripBlurred) stripBlurred.textContent = String(stats.femaleFacesBlurredToday);
    if (stripSafe) stripSafe.textContent = String(stats.safeImagesUnblurred);

    // Tab 3 Hero Counter & Metrics
    const heroCounter = document.getElementById('pv-counter-female-blurred');
    const metricSafe = document.getElementById('pv-metric-safe-unblurred');
    const metricAds = document.getElementById('pv-metric-ads-blocked');
    const metricSpeed = document.getElementById('pv-metric-scan-speed');
    const ytAdsNum = document.getElementById('pv-ads-blocked-num');

    const totalAds = 4 + (stats.adsBlockedToday || 0);
    if (heroCounter) heroCounter.textContent = String(stats.femaleFacesBlurredToday);
    if (metricSafe) metricSafe.textContent = String(stats.safeImagesUnblurred);
    if (metricAds) metricAds.textContent = String(totalAds);
    if (ytAdsNum) ytAdsNum.textContent = String(totalAds);
    if (metricSpeed) metricSpeed.textContent = `${stats.lastScanMs || 28}ms`;

    // Controls in Tab 3
    const masterSwitch = document.getElementById('pv-master-switch');
    if (masterSwitch) masterSwitch.checked = Boolean(settings.shieldEnabled);

    const modeFull = document.getElementById('pv-mode-full');
    const modeFace = document.getElementById('pv-mode-face-only');
    if (modeFull && modeFace) {
      modeFull.classList.toggle('selected', settings.blurMode === 'full');
      modeFace.classList.toggle('selected', settings.blurMode === 'face-only');
    }

    const blurSlider = document.getElementById('pv-blur-slider');
    const blurLabel = document.getElementById('pv-blur-strength-label');
    if (blurSlider) blurSlider.value = String(settings.blurStrength);
    if (blurLabel) {
      const level =
        settings.blurStrength < 18 ? 'Light' : settings.blurStrength < 32 ? 'Heavy' : 'Ultra Lock';
      blurLabel.textContent = `${settings.blurStrength}px (${level})`;
    }

    const adSwitch = document.getElementById('pv-adblock-switch');
    if (adSwitch) adSwitch.checked = Boolean(settings.youtubeAdBlock);

    const bgSwitch = document.getElementById('pv-bgaudio-switch');
    if (bgSwitch) bgSwitch.checked = Boolean(settings.backgroundAudio);

    const bgToggleBtn = document.getElementById('pv-bg-audio-toggle-btn');
    if (bgToggleBtn) {
      bgToggleBtn.classList.toggle('active', Boolean(settings.backgroundAudio));
      bgToggleBtn.textContent = settings.backgroundAudio
        ? '🎧 Background Audio: ON'
        : '🎧 Background Audio: OFF';
    }
  }

  function initEventHandlers() {
    // Bottom Navigation Tabs
    document.querySelectorAll('.pv-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-nav-target');
        switchTab(target);
      });
    });

    // Header Shield Quick Toggle
    const headerPill = document.getElementById('pv-header-shield-pill');
    if (headerPill) {
      headerPill.addEventListener('click', () => {
        window.PureViewAI.updateSettings({
          shieldEnabled: !window.PureViewAI.settings.shieldEnabled
        });
      });
    }

    // Open Live Test Feed button
    const openTestLabBtn = document.getElementById('pv-open-test-lab-btn');
    if (openTestLabBtn) {
      openTestLabBtn.addEventListener('click', () => {
        switchTab('settings');
        const section = document.getElementById('pv-live-test-lab-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Re-Scan AI Test Lab button
    const rescanBtn = document.getElementById('pv-rescan-test-lab-btn');
    if (rescanBtn) {
      rescanBtn.addEventListener('click', () => {
        window.PureViewAI.resultCache.clear();
        renderTestLab();
      });
    }

    // Master Shield Switch
    const masterSwitch = document.getElementById('pv-master-switch');
    if (masterSwitch) {
      masterSwitch.addEventListener('change', (e) => {
        window.PureViewAI.updateSettings({ shieldEnabled: e.target.checked });
      });
    }

    // Blur Mode Buttons (Full Image vs Face-Only)
    document.querySelectorAll('[data-blur-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-blur-mode');
        window.PureViewAI.updateSettings({ blurMode: mode });
      });
    });

    // Blur Strength Slider
    const blurSlider = document.getElementById('pv-blur-slider');
    if (blurSlider) {
      blurSlider.addEventListener('input', (e) => {
        window.PureViewAI.updateSettings({ blurStrength: Number(e.target.value) });
      });
    }

    // AdBlock & Background Audio Toggles
    const adSwitch = document.getElementById('pv-adblock-switch');
    if (adSwitch) {
      adSwitch.addEventListener('change', (e) => {
        window.PureViewAI.updateSettings({ youtubeAdBlock: e.target.checked });
      });
    }

    const bgSwitch = document.getElementById('pv-bgaudio-switch');
    if (bgSwitch) {
      bgSwitch.addEventListener('change', (e) => {
        window.PureViewAI.updateSettings({ backgroundAudio: e.target.checked });
      });
    }

    const bgToggleBtn = document.getElementById('pv-bg-audio-toggle-btn');
    if (bgToggleBtn) {
      bgToggleBtn.addEventListener('click', () => {
        window.PureViewAI.updateSettings({
          backgroundAudio: !window.PureViewAI.settings.backgroundAudio
        });
      });
    }

    // Play/Pause Background Tilawat Audio
    const playAudioBtn = document.getElementById('pv-play-audio-btn');
    if (playAudioBtn) {
      playAudioBtn.addEventListener('click', () => toggleBackgroundAudioPlayback());
    }
    const stopAudioBtn = document.getElementById('pv-stop-bg-audio-btn');
    if (stopAudioBtn) {
      stopAudioBtn.addEventListener('click', () => toggleBackgroundAudioPlayback(false));
    }

    // Simulate & Verify YouTube Ad-Blocker Auto-Skip
    const simAdBtn = document.getElementById('pv-simulate-ad-btn');
    if (simAdBtn) {
      simAdBtn.addEventListener('click', () => {
        const statusText = document.getElementById('pv-now-playing-status');
        window.PureViewAI.incrementAdsBlocked(1);
        if (statusText) {
          statusText.textContent = '🚫 PureView Ad-Blocker: Video Ad Intercepted & Auto-Skipped in 0.0s!';
        }
      });
    }

    // YouTube Category Filter Chips
    document.querySelectorAll('[data-yt-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-yt-filter]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        renderYouTubeFeed(chip.getAttribute('data-yt-filter'), currentYtSearch);
      });
    });

    // YouTube Search Input
    const ytSearchInput = document.getElementById('pv-yt-search-input');
    if (ytSearchInput) {
      ytSearchInput.addEventListener('input', (e) => {
        renderYouTubeFeed(currentYtFilter, e.target.value);
      });
    }

    // Live Reverse-Proxy Toggle for m.youtube.com
    const ytProxyBtn = document.getElementById('pv-yt-live-proxy-btn');
    const ytProxyContainer = document.getElementById('pv-yt-proxy-container');
    const ytProxyIframe = document.getElementById('pv-yt-proxy-iframe');
    const ytFeedWrapper = document.getElementById('pv-yt-feed-wrapper');
    if (ytProxyBtn && ytProxyContainer && ytProxyIframe && ytFeedWrapper) {
      ytProxyBtn.addEventListener('click', () => {
        const isShowingProxy = ytProxyContainer.style.display !== 'none';
        if (isShowingProxy) {
          ytProxyContainer.style.display = 'none';
          ytFeedWrapper.style.display = 'block';
          ytProxyBtn.classList.remove('active');
          ytProxyBtn.textContent = '🌐 Live m.youtube';
        } else {
          ytProxyContainer.style.display = 'block';
          ytFeedWrapper.style.display = 'none';
          ytProxyBtn.classList.add('active');
          ytProxyBtn.textContent = '🔙 Halal Feed';
          if (!ytProxyIframe.src) {
            ytProxyIframe.src = '/api/proxy-site?site=youtube';
          }
        }
      });
    }

    // Live Reverse-Proxy Toggle for m.facebook.com
    const fbProxyBtn = document.getElementById('pv-fb-live-proxy-btn');
    const fbProxyContainer = document.getElementById('pv-fb-proxy-container');
    const fbProxyIframe = document.getElementById('pv-fb-proxy-iframe');
    const fbFeedWrapper = document.getElementById('pv-fb-feed-wrapper');
    if (fbProxyBtn && fbProxyContainer && fbProxyIframe && fbFeedWrapper) {
      fbProxyBtn.addEventListener('click', () => {
        const isShowingProxy = fbProxyContainer.style.display !== 'none';
        if (isShowingProxy) {
          fbProxyContainer.style.display = 'none';
          fbFeedWrapper.style.display = 'block';
          fbProxyBtn.classList.remove('active');
          fbProxyBtn.textContent = '🌐 Live m.facebook';
        } else {
          fbProxyContainer.style.display = 'block';
          fbFeedWrapper.style.display = 'none';
          fbProxyBtn.classList.add('active');
          fbProxyBtn.textContent = '🔙 Halal Feed';
          if (!fbProxyIframe.src) {
            fbProxyIframe.src = '/api/proxy-site?site=facebook';
          }
        }
      });
    }

    // Listen for messages from proxied m.youtube / m.facebook iframes
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'PV_AD_BLOCKED') {
        window.PureViewAI.incrementAdsBlocked(data.count || 1);
      } else if (data.type === 'PV_FEMALE_BLURRED') {
        window.PureViewAI.recordFemaleFacesBlurred(data.count || 1);
      }
    });

    // Register Service Worker for Android PWA installation
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.PureViewAI.onUpdate(syncSettingsUI);
    window.PureViewAI.startMutationObserver();
    initEventHandlers();
    renderYouTubeFeed('all');
    renderFacebookFeed();
    renderTestLab();
    syncSettingsUI();
  });
})();
