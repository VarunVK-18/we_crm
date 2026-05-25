import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Opens a WhatsApp chat directly to the given phone number.
///
/// [phone] must be in international format with country code, NO '+' or spaces.
/// Example: '919876543210'  (91 = India, 9876543210 = number)
Future<void> openWhatsApp({
  required BuildContext context,
  required String phone, 
  String message = '',
}) async {
  if (phone.trim().isEmpty) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("The assigned staff hasn't provided a WhatsApp number."),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
    return;
  }

  // Ensure phone only contains digits and optional leading plus
  final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
  final encodedMessage = Uri.encodeComponent(message);

  // Try native WhatsApp app first (opens chat directly)
  final nativeUri = Uri.parse(
    'whatsapp://send?phone=$cleanPhone&text=$encodedMessage',
  );

  // Fallback: web URL (opens in browser if app not installed)
  final webUri = Uri.parse(
    'https://wa.me/$cleanPhone?text=$encodedMessage',
  );

  // NOTE: We do NOT use canLaunchUrl() — it can incorrectly return false
  // even when WhatsApp IS installed (common on Android 11+).
  // Instead we try directly and fall back gracefully.
  try {
    await launchUrl(nativeUri, mode: LaunchMode.externalApplication);
  } catch (_) {
    try {
      await launchUrl(webUri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Could not open WhatsApp. Please make sure it is installed."),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }
}
