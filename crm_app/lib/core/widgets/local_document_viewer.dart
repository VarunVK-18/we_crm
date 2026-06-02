import 'dart:io';
import 'package:flutter/material.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';

class LocalDocumentViewer extends StatelessWidget {
  final String filePath;

  const LocalDocumentViewer({super.key, required this.filePath});

  @override
  Widget build(BuildContext context) {
    final isPdf = filePath.toLowerCase().endsWith('.pdf');
    final file = File(filePath);
    final fileName = filePath.split('/').last;

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          fileName,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: SafeArea(
        child: isPdf
            ? PdfPreview(
                build: (format) => file.readAsBytesSync(),
                useActions: false,
                canChangeOrientation: false,
                canChangePageFormat: false,
                canDebug: false,
                initialPageFormat: PdfPageFormat.a4,
                pdfFileName: fileName,
                scrollViewDecoration: const BoxDecoration(color: Colors.black),
              )
            : Center(
                child: InteractiveViewer(
                  minScale: 0.5,
                  maxScale: 4.0,
                  child: Image.file(
                    file,
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
              ),
      ),
    );
  }
}
