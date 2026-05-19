import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../core/constants/port.dart';

// Mock Auth Class to replace Firebase Auth objects
class MockAuthUser {
  final String uid;
  final String? email;
  final String? displayName;

  MockAuthUser({required this.uid, this.email, this.displayName});
}

class AuthRepository {
  // Simple state management for mock auth
  final _authStateController = StreamController<MockAuthUser?>.broadcast();
  MockAuthUser? _currentUser;

  // Stream of User Auth State
  Stream<MockAuthUser?> get authStateChanges async* {
    yield _currentUser;
    yield* _authStateController.stream;
  }

  AuthRepository() {
    _currentUser = null;
    _authStateController.add(_currentUser);
  }

  // Sign In with Email/Password (Real API)
  Future<void> signIn(String email, String password) async {
    // Hardcoded Test Account for Testing
    if (email == 'test@wecrm.com' && password == 'password123') {
      _currentUser = MockAuthUser(
        uid: 'test-user-id',
        email: 'test@wecrm.com',
        displayName: 'Test User',
      );
      _authStateController.add(_currentUser);
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$kBaseUrl/api/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Handle cases where the response might be { user: { ... }, token: "..." }
        final userData = data['user'] ?? data;
        
        _currentUser = MockAuthUser(
          uid: userData['_id']?['\$oid']?.toString() ?? userData['id']?.toString() ?? 'unknown',
          email: userData['email']?.toString() ?? email,
          displayName: userData['owner_name']?.toString() ?? userData['name']?.toString(),
        );
        _authStateController.add(_currentUser);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to sign in');
      }
    } catch (e) {
      // Keep mock sign in as a fallback if the server is not reachable for testing?
      // No, user requested REAL structure. Let's throw error.
      rethrow;
    }
  }

  // Sign Up with Email/Password (Real API)
  Future<void> signUp({
    required String email,
    required String password,
    required String name,
    required String phone,
    required UserRole role,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$kBaseUrl/api/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'owner_name': name,
          'phone': phone,
          'role': role.name,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final userData = data['user'] ?? data;

        _currentUser = MockAuthUser(
          uid: userData['_id']?['\$oid']?.toString() ?? userData['id']?.toString() ?? 'unknown',
          email: userData['email']?.toString() ?? email,
          displayName: userData['owner_name']?.toString() ?? userData['name']?.toString(),
        );
        _authStateController.add(_currentUser);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to sign up');
      }
    } catch (e) {
      rethrow;
    }
  }

  // Sign Out
  Future<void> signOut() async {
    _currentUser = null;
    _authStateController.add(null);
  }

  // Get current user details as a Stream (Real API)
  Stream<UserModel?> getUserStream(String uid) async* {
    if (_currentUser == null) {
      yield null;
      return;
    }

    // Bypass for Test User
    if (uid == 'test-user-id') {
      yield UserModel(
        id: uid,
        name: 'Test User',
        email: 'test@wecrm.com',
        phone: '1234567890',
        role: UserRole.customer,
      );
      return;
    }

    try {
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/users/profile/$uid'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        yield UserModel.fromMap(data['user'] ?? data);
      } else {
        // Fallback to local constructor if profile fetch fails
        yield UserModel(
          id: uid,
          name: _currentUser?.displayName ?? 'User',
          email: _currentUser?.email ?? '',
          phone: '',
          role: UserRole.customer,
        );
      }
    } catch (e) {
      // Fallback
      yield UserModel(
        id: uid,
        name: _currentUser?.displayName ?? 'User',
        email: _currentUser?.email ?? '',
        phone: '',
        role: UserRole.customer,
      );
    }
  }
}
