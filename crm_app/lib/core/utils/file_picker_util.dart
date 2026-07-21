import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:crm_app/core/utils/error_handler.dart';

class FilePickerUtil {
  static const int maxFileSizeMB = 5;
  static const int maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  static final ImagePicker _imagePicker = ImagePicker();

  /// Picks files using FilePicker and enforces the 5MB limit.
  static Future<FilePickerResult?> pickFiles({
    FileType type = FileType.any,
    List<String>? allowedExtensions,
    bool allowMultiple = false,
  }) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: type,
        allowedExtensions: allowedExtensions,
        allowMultiple: allowMultiple,
      );

      if (result != null) {
        // Validate sizes
        for (var file in result.files) {
          if (file.size > maxFileSizeBytes) {
            showGlobalError(
              null,
              fallbackMessage: 'File "${file.name}" is too large! Maximum allowed size is ${maxFileSizeMB}MB.',
            );
            return null;
          }
        }
      }
      return result;
    } catch (e) {
      showGlobalError(e, fallbackMessage: 'Failed to pick file.');
      return null;
    }
  }

  /// Picks an image using ImagePicker and enforces the 5MB limit.
  static Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    try {
      final XFile? file = await _imagePicker.pickImage(
        source: source,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        imageQuality: imageQuality,
      );

      if (file != null) {
        final length = await file.length();
        if (length > maxFileSizeBytes) {
          showGlobalError(
            null,
            fallbackMessage: 'Image is too large! Maximum allowed size is ${maxFileSizeMB}MB.',
          );
          return null;
        }
      }
      return file;
    } catch (e) {
      showGlobalError(e, fallbackMessage: 'Failed to pick image.');
      return null;
    }
  }
}
