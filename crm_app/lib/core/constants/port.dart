import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

const bool useLocalBackend = false;
const bool isEmulator = false;
String localHostIP ='192.168.29.105';

String getBaseUrl() {
  if (useLocalBackend) {
    if (kIsWeb) {
      return 'http://${localHostIP}:5001';
    }
    if (Platform.isAndroid && isEmulator) {
      return 'http://${localHostIP}:5001'; // Android emulator specific loopback
    }
    // For iOS simulator, iOS physical device, and Android physical device:
    return 'http://${localHostIP}:5001';
  }
  return 'https://we-crm.onrender.com'; // Develop Backend
}

final String kBaseUrl = getBaseUrl();
