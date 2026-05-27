import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';

class DocumentViewerScreen extends StatefulWidget {
  final String documentId;
  final String documentName;

  const DocumentViewerScreen({
    super.key,
    required this.documentId,
    required this.documentName,
  });

  @override
  State<DocumentViewerScreen> createState() => _DocumentViewerScreenState();
}

class _DocumentViewerScreenState extends State<DocumentViewerScreen> {
  Uint8List? _fileBytes;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isPdf = false;

  @override
  void initState() {
    super.initState();
    _checkFileType();
    _downloadFile();
  }

  void _checkFileType() {
    final lowerName = widget.documentName.toLowerCase();
    _isPdf = lowerName.endsWith('.pdf');
  }

  Future<void> _downloadFile() async {
    try {
      final url = Uri.parse('$kBaseUrl/api/documents/${widget.documentId}');
      final response = await http.get(url).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _fileBytes = response.bodyBytes;
            _isLoading = false;
          });
        }
      } else {
        throw Exception('Failed to load document');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _triggerExternalDownload() async {
    if (_fileBytes == null) return;

    try {
      // Use the native share/save dialog for both iOS and Android.
      // This allows the user to explicitly "Save to Files", "Send to WhatsApp", etc.
      await Printing.sharePdf(
        bytes: _fileBytes!,
        filename: widget.documentName,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed to share/save: $e'),
              backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          widget.documentName,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.download),
            tooltip: 'Download to Device',
            onPressed: _triggerExternalDownload,
          ),
        ],
      ),
      body: SafeArea(
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.activeOrange),
      );
    }

    if (_errorMessage != null || _fileBytes == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.fileWarning, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            const Text(
              'Failed to load document',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Unknown error',
              style:
                  TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isLoading = true;
                  _errorMessage = null;
                });
                _downloadFile();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.activeOrange,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_isPdf) {
      return PdfPreview(
        build: (format) => _fileBytes!,
        useActions: false, // We handle actions via AppBar
        canChangeOrientation: false,
        canChangePageFormat: false,
        canDebug: false,
        initialPageFormat: PdfPageFormat.a4,
        pdfFileName: widget.documentName,
        maxPageWidth: 800,
        scrollViewDecoration: const BoxDecoration(color: Colors.black),
      );
    }

    return Center(
      child: InteractiveViewer(
        minScale: 0.5,
        maxScale: 4.0,
        child: Image.memory(
          _fileBytes!,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return const Center(
              child: Text(
                'Invalid Image Format',
                style: TextStyle(color: Colors.white),
              ),
            );
          },
        ),
      ),
    );
  }
}
