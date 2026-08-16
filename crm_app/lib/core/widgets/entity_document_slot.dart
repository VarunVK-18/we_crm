import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../../features/orders/document_viewer_screen.dart';

/// A reusable widget that shows an entity-profile prefilled document.
/// The user can:
///   👁  View it in the in-app viewer
///   🔄  Replace it (calls [onReplace] → picks a new file)
///   ✕   Remove the prefill and pick their own (calls [onClear])
class EntityDocumentSlot extends StatelessWidget {
  /// The label shown above the slot
  final String label;

  /// Subtitle hint
  final String hint;

  /// The prefilled document ID (from entity profile), or null
  final String? prefillDocId;

  /// The prefilled document name, or null
  final String? prefillDocName;

  /// The locally picked file path (overrides prefill display)
  final String? localFilePath;

  /// Called when the user taps Replace / Pick
  final VoidCallback onReplace;

  /// Called when user taps Remove (to clear prefill and pick new)
  final VoidCallback? onClear;

  const EntityDocumentSlot({
    super.key,
    required this.label,
    this.hint = '',
    this.prefillDocId,
    this.prefillDocName,
    this.localFilePath,
    required this.onReplace,
    this.onClear,
  });

  bool get _hasPrefill => (prefillDocId?.isNotEmpty ?? false);
  bool get _hasLocal => (localFilePath?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context) {
    if (_hasLocal) {
      // User picked a new local file — show local file name
      final fileName = localFilePath!.split('/').last.split('\\').last;
      return _buildSlot(
        context,
        icon: LucideIcons.fileCheck,
        iconColor: AppTheme.deepTeal,
        text: fileName,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _actionButton(
              icon: LucideIcons.refreshCw,
              color: AppTheme.corporateBlue,
              tooltip: 'Replace',
              onTap: onReplace,
            ),
          ],
        ),
      );
    }

    if (_hasPrefill) {
      // Prefill from entity profile — show with eye + replace
      return _buildSlot(
        context,
        icon: LucideIcons.fileText,
        iconColor: AppTheme.activeOrange,
        text: prefillDocName ?? 'Prefilled Document',
        isAutoFilled: true,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _actionButton(
              icon: LucideIcons.eye,
              color: AppTheme.corporateBlue,
              tooltip: 'View',
              onTap: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => DocumentViewerScreen(
                    documentId: prefillDocId!,
                    documentName: prefillDocName ?? 'Document',
                  ),
                ));
              },
            ),
            const SizedBox(width: 4),
            _actionButton(
              icon: LucideIcons.refreshCw,
              color: AppTheme.activeOrange,
              tooltip: 'Replace',
              onTap: onReplace,
            ),
          ],
        ),
      );
    }

    // Nothing picked yet — show upload prompt
    return _buildSlot(
      context,
      icon: LucideIcons.uploadCloud,
      iconColor: Colors.grey,
      text: hint.isNotEmpty ? hint : 'Tap to upload',
      trailing: _actionButton(
        icon: LucideIcons.uploadCloud,
        color: AppTheme.corporateBlue,
        tooltip: 'Upload',
        onTap: onReplace,
      ),
    );
  }

  Widget _buildSlot(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String text,
    bool isAutoFilled = false,
    Widget? trailing,
  }) {
    return GestureDetector(
      onTap: _hasLocal || _hasPrefill ? null : onReplace,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isAutoFilled
              ? AppTheme.activeOrange.withValues(alpha: 0.06)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isAutoFilled
                ? AppTheme.activeOrange.withValues(alpha: 0.4)
                : Colors.grey.shade300,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isAutoFilled ? AppTheme.activeOrange : Colors.grey.shade700,
                  ),
                ),
                if (isAutoFilled) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.activeOrange.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Auto-filled',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.activeOrange,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(icon, size: 18, color: iconColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    text,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (trailing != null) trailing,
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required Color color,
    required String tooltip,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }
}
