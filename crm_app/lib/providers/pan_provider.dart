import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/ocr_service.dart';

class PanNotifier extends StateNotifier<List<ExtractedPanData>> {
  PanNotifier() : super([]);

  void addPanCard(ExtractedPanData pan) {
    // Avoid adding exact duplicates based on panNumber
    if (!state.any((element) => element.panNumber == pan.panNumber)) {
      state = [...state, pan];
    } else {
      // If it exists, optionally update it
      state = [
        for (final p in state)
          if (p.panNumber == pan.panNumber) pan else p,
      ];
    }
  }

  void removePanCard(String panNumber) {
    state = state.where((p) => p.panNumber != panNumber).toList();
  }
}

final panProvider = StateNotifierProvider<PanNotifier, List<ExtractedPanData>>((ref) {
  return PanNotifier();
});
