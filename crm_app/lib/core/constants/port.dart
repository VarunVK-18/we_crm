import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

const bool useLocalBackend = true;
const bool isEmulator = false;

String getBaseUrl() {
  if (useLocalBackend) {
    if (kIsWeb) {
      return 'http://localhost:5001';
    }
    if (Platform.isAndroid) {
      if (isEmulator) {
        return 'http://10.0.2.2:5001'; // Default IP for Android emulator to connect to local host
      } else {
        return 'http://192.168.0.5:5001'; // User's current WiFi IP address
      }
    }
    return 'http://localhost:5001';
  }
  return 'https://peoplesoft-develop.onrender.com'; // Develop Backend
}

final String kBaseUrl = getBaseUrl();
