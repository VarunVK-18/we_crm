import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Manage current index of bottom navigation bar globally.
final navigationIndexProvider = StateProvider<int>((ref) => 0);

/// Flag to automatically trigger the biometric/pin setup in the profile screen
final autoTriggerSecurityProvider = StateProvider<bool>((ref) => false);
