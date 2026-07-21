import 'package:flutter/material.dart';

/// Global key to access the ScaffoldMessenger without a BuildContext
final GlobalKey<ScaffoldMessengerState> globalScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Shows a standardized red SnackBar for network and unexpected errors globally.
void showGlobalError(dynamic error, {String fallbackMessage = 'An unexpected error occurred. Please check your network connection.'}) {
  String message = fallbackMessage;

  // You can customize parsing the error here if needed.
  if (error != null) {
    String errorString = error.toString().toLowerCase();
    if (errorString.contains('socketexception') || errorString.contains('clientexception') || errorString.contains('connection')) {
      message = 'Network error: Cannot connect to the server.';
    } else if (errorString.contains('timeout')) {
      message = 'Connection timed out. Please try again.';
    }
  }

  // Display the snackbar
  globalScaffoldMessengerKey.currentState?.showSnackBar(
    SnackBar(
      content: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.white),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
      backgroundColor: Colors.red.shade600,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      margin: const EdgeInsets.all(16),
      duration: const Duration(seconds: 4),
    ),
  );
}
