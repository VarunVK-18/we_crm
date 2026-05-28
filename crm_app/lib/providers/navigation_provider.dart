import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Manage current index of bottom navigation bar globally.
final navigationIndexProvider = StateProvider<int>((ref) => 0);
