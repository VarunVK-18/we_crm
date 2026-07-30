import 'package:flutter/material.dart';

/// Global key to access the ScaffoldMessenger without a BuildContext
final GlobalKey<ScaffoldMessengerState> globalScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Shows a standardized red SnackBar for network and unexpected errors globally.
void showGlobalError(dynamic error, {String fallbackMessage = 'An unexpected error occurred. Please check your network connection.'}) {
  // User requested to completely disable all global error popups.
  // We simply return here to prevent any SnackBars from appearing.
  return;
}
