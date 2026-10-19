package com.pureview.ai;

import android.graphics.Bitmap;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * PureViewWebViewClient:
 * 1. Intercepts YouTube (i.ytimg.com, yt3.ggpht.com) & Facebook (scontent.*.fbcdn.net) images
 *    and injects Access-Control-Allow-Origin: * headers so AI Canvas scanning never hits CORS errors.
 * 2. Blocks YouTube & Facebook video/banner ad network requests at the WebView layer.
 * 3. Injects 0ms Zero-Leak Blur-First CSS & Female-Face AI Content Script into m.youtube.com & m.facebook.com.
 */
public class PureViewWebViewClient extends WebViewClient {

    private final MainActivity activity;

    private static final String[] AD_DOMAINS = new String[]{
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "adservice.google.com",
        "pagead2.googlesyndication.com",
        "an.facebook.com"
    };

    public PureViewWebViewClient(MainActivity activity) {
        this.activity = activity;
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (uri == null) return super.shouldInterceptRequest(view, request);

        String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";
        String urlStr = uri.toString();

        // 0. Serve bundled PureView UI, AI models & test images from Android assets over HTTPS origin
        if ("appassets.androidplatform.net".equals(host)) {
            String path = uri.getPath();
            if (path == null || path.isEmpty() || "/".equals(path)) {
                path = "/index.html";
            }
            String assetRel = "public/" + path.replaceFirst("^/+", "");
            try {
                InputStream assetStream = activity.getAssets().open(assetRel);
                String mime = guessMimeType(assetRel);
                return new WebResourceResponse(
                    mime,
                    "UTF-8",
                    200,
                    "OK",
                    createCorsHeaders(),
                    assetStream
                );
            } catch (Exception ignored) {
                // Fall through if asset does not exist
            }
        }

        // 1. Built-in YouTube & Facebook Ad-Blocker
        for (String adDomain : AD_DOMAINS) {
            if (host.contains(adDomain) || urlStr.contains("/pagead/") || urlStr.contains("/api/stats/ads")) {
                activity.incrementAdsBlocked();
                return new WebResourceResponse(
                    "text/plain",
                    "UTF-8",
                    204,
                    "No Content",
                    createCorsHeaders(),
                    new ByteArrayInputStream(new byte[0])
                );
            }
        }

        // 2. Native CORS Bypass Interceptor for YouTube & Facebook Image Servers
        if (host.contains("ytimg.com") || host.contains("ggpht.com") ||
            host.contains("fbcdn.net") || host.contains("googleusercontent.com")) {
            try {
                URL url = new URL(urlStr);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(7000);
                conn.setReadTimeout(7000);
                conn.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36");

                int statusCode = conn.getResponseCode();
                String contentType = conn.getContentType();
                if (contentType == null) contentType = "image/jpeg";
                if (contentType.contains(";")) {
                    contentType = contentType.split(";")[0].trim();
                }

                InputStream inputStream = conn.getInputStream();
                Map<String, String> headers = createCorsHeaders();
                headers.put("Cache-Control", "public, max-age=3600");

                return new WebResourceResponse(
                    contentType,
                    "BINARY",
                    statusCode,
                    "OK",
                    headers,
                    inputStream
                );
            } catch (Exception ignored) {
                // Fall back to default WebView loader if direct stream fails
            }
        }

        return super.shouldInterceptRequest(view, request);
    }

    private String guessMimeType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    private Map<String, String> createCorsHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        headers.put("Access-Control-Allow-Headers", "*");
        headers.put("Cross-Origin-Resource-Policy", "cross-origin");
        return headers;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        injectZeroLeakBlurFirstCSS(view);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        injectZeroLeakBlurFirstCSS(view);
        if (url != null && (url.contains("youtube.com") || url.contains("facebook.com"))) {
            injectPureViewContentScript(view);
        }
    }

    private void injectZeroLeakBlurFirstCSS(WebView view) {
        if (!activity.isShieldEnabled()) return;
        int blurPx = activity.getBlurStrength();
        String js = "(function(){" +
            "if(document.getElementById('pv-native-zero-leak')) return;" +
            "var st=document.createElement('style');" +
            "st.id='pv-native-zero-leak';" +
            "st.textContent='img:not([data-pv-status=\"safe\"]):not(.pv-ui-icon),video:not([data-pv-status=\"safe\"]){filter:blur(" + blurPx + "px) !important;transition:none !important;}';" +
            "(document.head||document.documentElement).appendChild(st);" +
            "})();";
        view.evaluateJavascript(js, null);
    }

    private void injectPureViewContentScript(WebView view) {
        try (InputStream is = activity.getAssets().open("public/js/pureview-webview-inject.js")) {
            byte[] bytes = new byte[is.available()];
            int read = is.read(bytes);
            if (read > 0) {
                String script = new String(bytes, 0, read, StandardCharsets.UTF_8);
                view.evaluateJavascript(script, null);
            }
        } catch (Exception ignored) {}
    }
}
