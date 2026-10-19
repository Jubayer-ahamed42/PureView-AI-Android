package com.pureview.ai;

import android.webkit.JavascriptInterface;
import org.json.JSONObject;

/**
 * PureViewJSBridge: Native Android <-> WebView JavaScript Bridge
 */
public class PureViewJSBridge {

    private final MainActivity activity;

    public PureViewJSBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void setShieldConfig(boolean enabled, String blurMode, int blurStrength, boolean bgAudio) {
        activity.setShieldEnabled(enabled);
        activity.setBlurMode(blurMode != null ? blurMode : "full");
        activity.setBlurStrength(blurStrength);
        activity.setBackgroundAudioEnabled(bgAudio);
    }

    @JavascriptInterface
    public void reportFemaleFaceBlurred(int count) {
        activity.incrementFemaleFacesBlurred(Math.max(1, count));
    }

    @JavascriptInterface
    public String getNativeStatsJson() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("shieldEnabled", activity.isShieldEnabled());
            obj.put("blurMode", activity.getBlurMode());
            obj.put("blurStrength", activity.getBlurStrength());
            obj.put("backgroundAudioEnabled", activity.isBackgroundAudioEnabled());
            obj.put("femaleFacesBlurredToday", activity.getFemaleFacesBlurredToday());
            obj.put("adsBlockedCount", activity.getAdsBlockedCount());
            obj.put("platform", "android-native-webview");
            return obj.toString();
        } catch (Exception e) {
            return "{}";
        }
    }
}
