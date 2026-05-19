import 'package:url_launcher/url_launcher.dart';

/// Opens a WhatsApp chat directly to the given phone number.
///
/// [phone] must be in international format with country code, NO '+' or spaces.
/// Example: '919876543210'  (91 = India, 9876543210 = number)
Future<void> openWhatsApp({required String phone, String message = ''}) async {
  if (phone.trim().isEmpty) return;

  final encodedMessage = Uri.encodeComponent(message);

  // Try native WhatsApp app first (opens chat directly)
  final nativeUri = Uri.parse(
    'whatsapp://send?phone=$phone&text=$encodedMessage',
  );

  // Fallback: web URL (opens in browser if app not installed)
  final webUri = Uri.parse(
    'https://wa.me/$phone?text=$encodedMessage',
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
      // WhatsApp not available and no browser — silently ignore
    }
  }
}
