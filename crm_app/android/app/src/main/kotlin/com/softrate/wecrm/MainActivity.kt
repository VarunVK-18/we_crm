package com.softrate.wecrm

import android.os.Bundle
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Immediately dismiss the Android 12+ system splash screen
        installSplashScreen()
        super.onCreate(savedInstanceState)
    }
}
