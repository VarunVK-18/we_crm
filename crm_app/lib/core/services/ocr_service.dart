import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

class ExtractedPanData {
  final String panNumber;
  final String name;
  final String fatherName;
  final String dob;

  ExtractedPanData({
    required this.panNumber,
    required this.name,
    required this.fatherName,
    required this.dob,
  });

  bool get isEmpty =>
      panNumber.isEmpty && name.isEmpty && fatherName.isEmpty && dob.isEmpty;

  @override
  String toString() {
    return 'PAN: $panNumber\nName: $name\nFather: $fatherName\nDOB: $dob';
  }
}

class OcrService {
  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  Future<ExtractedPanData> extractPanData(File imageFile) async {
    try {
      final inputImage = InputImage.fromFile(imageFile);
      final recognizedText = await _textRecognizer.processImage(inputImage);
      
      return _parsePanData(recognizedText.text);
    } catch (e) {
      debugPrint('Error processing OCR: $e');
      return ExtractedPanData(panNumber: '', name: '', fatherName: '', dob: '');
    }
  }

  void dispose() {
    _textRecognizer.close();
  }

  ExtractedPanData _parsePanData(String text) {
    String panNumber = '';
    String name = '';
    String fatherName = '';
    String dob = '';

    // Clean up text
    List<String> lines = text.split('\n').map((e) => e.trim().toUpperCase()).where((e) => e.isNotEmpty).toList();

    // Regex for PAN Number (5 letters, 4 numbers, 1 letter)
    final panRegex = RegExp(r'[A-Z]{5}[0-9]{4}[A-Z]');
    // Regex for DOB (DD/MM/YYYY or DD-MM-YYYY)
    final dobRegex = RegExp(r'\d{2}[/|-]\d{2}[/|-]\d{4}');

    // 1. Direct Pattern Matching for PAN and DOB
    for (String line in lines) {
      // Clean spaces for PAN matching in case OCR added spaces (e.g., A B C D E 1 2 3 4 F)
      String noSpaceLine = line.replaceAll(' ', '');
      if (panNumber.isEmpty) {
        final panMatch = panRegex.firstMatch(noSpaceLine);
        if (panMatch != null) {
          panNumber = panMatch.group(0) ?? '';
        }
      }

      if (dob.isEmpty) {
        final dobMatch = dobRegex.firstMatch(line);
        if (dobMatch != null) {
          dob = dobMatch.group(0)!.replaceAll('-', '/');
        }
      }
    }

    // 2. Keyword-based parsing (New PAN card format)
    for (int i = 0; i < lines.length; i++) {
      String line = lines[i];
      
      // Exact match or contains NAME but not FATHER
      if (line == 'NAME' || (line.contains('NAME') && !line.contains('FATHER'))) {
        if (name.isEmpty && i + 1 < lines.length) {
          String nextLine = lines[i + 1];
          if (!_isStopWord(nextLine) && !dobRegex.hasMatch(nextLine)) {
            name = nextLine;
          }
        }
      }
      
      if (line.contains('FATHER')) {
        if (fatherName.isEmpty && i + 1 < lines.length) {
          String nextLine = lines[i + 1];
          if (!_isStopWord(nextLine) && !dobRegex.hasMatch(nextLine)) {
            fatherName = nextLine;
          }
        }
      }
    }

    // 3. Positional Fallback (Old PAN card format)
    if (name.isEmpty || fatherName.isEmpty) {
      int dobIndex = -1;
      for (int i = 0; i < lines.length; i++) {
        if (dobRegex.hasMatch(lines[i])) {
          dobIndex = i;
          break;
        }
      }

      if (dobIndex != -1) {
        // Look upwards from DOB
        List<String> validNames = [];
        for (int i = dobIndex - 1; i >= 0; i--) {
          String candidate = lines[i];
          if (!_isStopWord(candidate) && candidate.length > 2) {
            validNames.add(candidate);
          }
          if (validNames.length == 2) break;
        }

        if (validNames.length >= 2) {
          if (fatherName.isEmpty) fatherName = validNames[0]; // Line directly above DOB
          if (name.isEmpty) name = validNames[1]; // Line two lines above DOB
        } else if (validNames.length == 1) {
          if (name.isEmpty) name = validNames[0];
        }
      }
    }

    // 4. Heuristic Fallback based on Govt headers
    if (name.isEmpty) {
      for (int i = 0; i < lines.length; i++) {
        if (lines[i].contains('INCOME TAX') || lines[i].contains('GOVT') || lines[i].contains('INDIA')) {
          if (i + 1 < lines.length) {
            String candidate = lines[i + 1];
            if (!_isStopWord(candidate)) {
              name = candidate;
              if (fatherName.isEmpty && i + 2 < lines.length) {
                String candidateFather = lines[i + 2];
                if (!_isStopWord(candidateFather)) {
                  fatherName = candidateFather;
                }
              }
            }
          }
          break;
        }
      }
    }

    // Clean up results (remove random special characters OCR might have picked up)
    name = name.replaceAll(RegExp(r'[^A-Z\s]'), '').trim();
    fatherName = fatherName.replaceAll(RegExp(r'[^A-Z\s]'), '').trim();

    return ExtractedPanData(
      panNumber: panNumber,
      name: name,
      fatherName: fatherName,
      dob: dob,
    );
  }

  bool _isStopWord(String text) {
    final stops = [
      'INCOME', 'TAX', 'DEPARTMENT', 'GOVT', 'INDIA', 'GOVERNMENT', 'PERMANENT',
      'ACCOUNT', 'NUMBER', 'CARD', 'SIGNATURE', 'NAME', 'FATHER', 'DATE', 'BIRTH',
      'AUTHORISED', 'SIGNATORY', 'DOB', 'P/N'
    ];
    for (var stop in stops) {
      if (text.contains(stop)) return true;
    }
    return false;
  }
}
