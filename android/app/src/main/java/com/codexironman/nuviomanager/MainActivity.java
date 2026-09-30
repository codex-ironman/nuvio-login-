package com.codexironman.nuviomanager;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String HOME = "https://codex-ironman.github.io/nuvio-login-/";
    private WebView web;
    private ProgressBar progress;
    private LinearLayout errorView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(11,15,23));
        getWindow().setNavigationBarColor(Color.rgb(11,15,23));
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(11,15,23));
        root.setOnApplyWindowInsetsListener((view,insets)->{view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
        progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);root.addView(progress,new LinearLayout.LayoutParams(-1,6));
        errorView=new LinearLayout(this);errorView.setOrientation(LinearLayout.VERTICAL);errorView.setPadding(32,48,32,32);errorView.setVisibility(View.GONE);
        TextView message=new TextView(this);message.setText("Nuvio Manager could not load. Check your internet connection and try again.");message.setTextColor(Color.WHITE);message.setTextSize(18);errorView.addView(message);
        Button retry=new Button(this);retry.setText("Try again");retry.setOnClickListener(v->{errorView.setVisibility(View.GONE);web.setVisibility(View.VISIBLE);web.loadUrl(HOME);});errorView.addView(retry);root.addView(errorView);
        web=new WebView(this);web.setBackgroundColor(Color.rgb(11,15,23));root.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setCacheMode(WebSettings.LOAD_NO_CACHE);settings.setSupportMultipleWindows(true);settings.setJavaScriptCanOpenWindowsAutomatically(false);settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){if(!request.isForMainFrame())return false;Uri uri=request.getUrl();if(isApp(uri))return false;openExternal(uri);return true;}
            @Override public void onReceivedError(WebView view,WebResourceRequest req,WebResourceError error){if(req.isForMainFrame()){web.setVisibility(View.GONE);errorView.setVisibility(View.VISIBLE);progress.setVisibility(View.GONE);}}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView view,int value){progress.setProgress(value);progress.setVisibility(value==100?View.GONE:View.VISIBLE);}
            @Override public boolean onCreateWindow(WebView view,boolean isDialog,boolean userGesture,Message result){
                if(!userGesture)return false;
                WebView popup=new WebView(MainActivity.this);popup.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){openExternal(req.getUrl());v.destroy();return true;} @Override public boolean shouldOverrideUrlLoading(WebView v,String url){openExternal(Uri.parse(url));v.destroy();return true;}});
                ((WebView.WebViewTransport)result.obj).setWebView(popup);result.sendToTarget();return true;
            }
        });
        web.loadUrl(HOME);
    }
    private boolean isApp(Uri uri){return "https".equals(uri.getScheme())&&"codex-ironman.github.io".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/nuvio-login-/");}
    private void openExternal(Uri uri){if(!"https".equals(uri.getScheme()))return;try{startActivity(new Intent(Intent.ACTION_VIEW,uri).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception e){new AlertDialog.Builder(this).setMessage("No browser is available to open the Nuvio login page.").setPositiveButton("OK",null).show();}}
    @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else new AlertDialog.Builder(this).setMessage("Close Nuvio Manager? Connected accounts will need to sign in again.").setPositiveButton("Close",(d,w)->finish()).setNegativeButton("Stay",null).show();}
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.loadUrl("about:blank");web.clearHistory();web.clearCache(true);web.destroy();}super.onDestroy();}
}
