import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

const bool useLocalBackend = false;
const bool isEmulator = false;

String getBaseUrl() {
  if (useLocalBackend) {
    if (kIsWeb) {
      return 'http://10.156.61.219:5001';
    }
    if (Platform.isAndroid && isEmulator) {
      return 'http://10.156.61.219:5001'; // Android emulator specific loopback
    }
    // For iOS simulator, iOS physical device, and Android physical device:
    return 'http://10.156.61.219:5001';
  }
  return 'https://we-crm.onrender.com'; // Develop Backend
}

final String kBaseUrl = getBaseUrl();
