package com.travelgennie.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final int MIC_PERMISSION = 17;
    private PermissionRequest pendingPermissionRequest;
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(
            new WebChromeClient() {
                @Override
                public void onPermissionRequest(PermissionRequest request) {
                    pendingPermissionRequest = request;
                    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED) {
                        request.grant(request.getResources());
                        pendingPermissionRequest = null;
                        return;
                    }
                    requestPermissions(new String[] {Manifest.permission.RECORD_AUDIO}, MIC_PERMISSION);
                }
            }
        );

        webView.loadUrl(BuildConfig.APP_URL);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != MIC_PERMISSION || pendingPermissionRequest == null) {
            return;
        }
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
        } else {
            pendingPermissionRequest.deny();
        }
        pendingPermissionRequest = null;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
