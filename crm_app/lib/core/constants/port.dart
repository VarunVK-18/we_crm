import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

const bool useLocalBackend = true;
const bool isEmulator = false;
String localHostIP = '10.111.189.219';

String getBaseUrl() {
  if (useLocalBackend) {
    if (kIsWeb) {
      return 'http://127.0.0.1:5001';
    }
    if (Platform.isAndroid) {
      if (isEmulator) {
        // 10.0.2.2 is the special IP for Android emulator to connect to host's localhost
        return 'http://10.0.2.2:5001';
      }
      // For physical Android devices on the same Wi-Fi
      return 'http://$localHostIP:5001';
    }
    if (Platform.isIOS) {
      // iOS simulator uses localhost
      return 'http://127.0.0.1:5001';
    }
    // Windows / Mac / Linux
    return 'http://127.0.0.1:5001';
  }
  return 'https://aistartupdoctor.com'; // Develop Backend
}

final String kBaseUrl = getBaseUrl();
