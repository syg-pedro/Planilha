package com.pedro.financeirofamiliar;

import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FinanceWidgetPlugin.class);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        // Own the WebView margins so the keyboard and system bars are not counted twice.
        ViewCompat.setOnApplyWindowInsetsListener(getBridge().getWebView(), (view, windowInsets) -> {
            Insets safeArea = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams margins = (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            int bottom = Math.max(safeArea.bottom, keyboard.bottom);
            if (margins.leftMargin != safeArea.left || margins.topMargin != safeArea.top
                || margins.rightMargin != safeArea.right || margins.bottomMargin != bottom) {
                margins.setMargins(safeArea.left, safeArea.top, safeArea.right, bottom);
                view.setLayoutParams(margins);
            }
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(getBridge().getWebView());
        getWindow().setStatusBarColor(Color.rgb(23, 28, 37));
        getWindow().setNavigationBarColor(Color.rgb(23, 28, 37));
    }
}
