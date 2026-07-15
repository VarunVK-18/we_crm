import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

const bool useLocalBackend = true;
const bool isEmulator = false;
String localHostIP = '10.211.59.244';

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
  return 'https://wecrm.wealthempires.in'; // Develop Backend
}

final String kBaseUrl = getBaseUrl();
