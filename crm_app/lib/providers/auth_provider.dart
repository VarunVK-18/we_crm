import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/auth_repository.dart';
import '../models/user_model.dart';

final authRepositoryProvider = Provider((ref) => AuthRepository());

final authStateProvider = StreamProvider<MockAuthUser?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

// A provider to fetch and track the current user's profile in real-time
final userProfileProvider = StreamProvider<UserModel?>((ref) {
  final authState = ref.watch(authStateProvider).value;
  if (authState == null) return Stream.value(null);
  
  final stream = ref.watch(authRepositoryProvider).getUserStream(authState.uid);
  
  return stream;
});
