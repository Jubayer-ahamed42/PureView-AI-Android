package com.pureview.ai;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

/**
 * MainActivity for PureView AI (100% Android-Focused Islamic AI Super-App).
 * Hosts the PureView Super-App interface & Halal YouTube / Halal Facebook WebView
 * with Zero-Leak Blur-First CSS, Real Female-Face AI, CORS Bypass Interceptor,
 * Built-in Ad-Blocker, and Screen-Off Background Audio Playback.
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private PowerManager.WakeLock wakeLock;

    private volatile boolean shieldEnabled = true;
    private volatile String blurMode = "full"; // "full" or "face-only"
    private volatile int blurStrength = 25;
    private volatile boolean backgroundAudioEnabled = true;
    private volatile int femaleFacesBlurredToday = 0;
    private volatile int adsBlockedCount = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PureViewAI::BackgroundAudioWakeLock");
        }

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 PureViewAI/1.0"
        );

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new PureViewWebViewClient(this));
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new PureViewJSBridge(this), "PureViewNative");

        // Load bundled PureView Android Super-App UI via HTTPS asset domain (falls back to file:///android_asset)
        webView.loadUrl("https://appassets.androidplatform.net/index.html");
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Keep WebView media & timers alive when Background Audio Play is active (for Quran/Nasheed/Lectures)
        if (!backgroundAudioEnabled && webView != null) {
            webView.onPause();
        } else if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(4 * 60 * 60 * 1000L);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus && backgroundAudioEnabled && webView != null) {
            // Prevent YouTube/WebView from pausing audio when phone screen locks
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    public boolean isShieldEnabled() { return shieldEnabled; }
    public void setShieldEnabled(boolean enabled) { this.shieldEnabled = enabled; }

    public String getBlurMode() { return blurMode; }
    public void setBlurMode(String mode) { this.blurMode = mode; }

    public int getBlurStrength() { return blurStrength; }
    public void setBlurStrength(int strength) { this.blurStrength = strength; }

    public boolean isBackgroundAudioEnabled() { return backgroundAudioEnabled; }
    public void setBackgroundAudioEnabled(boolean enabled) { this.backgroundAudioEnabled = enabled; }

    public int getFemaleFacesBlurredToday() { return femaleFacesBlurredToday; }
    public void incrementFemaleFacesBlurred(int delta) { this.femaleFacesBlurredToday += delta; }

    public int getAdsBlockedCount() { return adsBlockedCount; }
    public void incrementAdsBlocked() { this.adsBlockedCount++; }
}
