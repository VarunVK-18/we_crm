import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provider to track the currently selected business entity for compliance views
final selectedEntityProvider = StateProvider<String>((ref) {
  return 'Balaji Enterprises Pvt Ltd'; // Default selection
});
