import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../models/chat_message_model.dart';
import 'auth_provider.dart';

class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;

  ChatState({
    this.messages = const [],
    this.isLoading = true,
    this.error,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final String orderId;
  final Ref ref;
  Timer? _pollingTimer;

  ChatNotifier(this.orderId, this.ref) : super(ChatState()) {
    fetchMessages();
    // Poll for new messages every 5 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      fetchMessages(isBackground: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> fetchMessages({bool isBackground = false}) async {
    if (!isBackground) {
      state = state.copyWith(isLoading: true);
    }

    try {
      final response = await http.get(Uri.parse('$kBaseUrl/api/chat/$orderId'));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> msgsJson = data['messages'] ?? [];
        final messages = msgsJson.map((m) => ChatMessage.fromJson(m)).toList();

        if (mounted) {
          state = state.copyWith(
            messages: messages,
            isLoading: false,
            error: null,
          );
          markAsSeen();
        }
      } else {
        if (mounted && !isBackground) {
          state = state.copyWith(
            isLoading: false,
            error: 'Failed to load messages',
          );
        }
      }
    } catch (e) {
      if (mounted && !isBackground) {
        state = state.copyWith(
          isLoading: false,
          error: e.toString(),
        );
      }
    }
  }

  Future<bool> sendMessage(String content, {String senderRole = 'client'}) async {
    final user = ref.read(authStateProvider).value;
    if (user == null) return false;

    try {
      final response = await http.post(
        Uri.parse('$kBaseUrl/api/chat/$orderId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'senderId': user.uid,
          'senderRole': senderRole,
          'content': content,
        }),
      );

      if (response.statusCode == 201) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final newMessage = ChatMessage.fromJson(data['message']);
        
        if (mounted) {
          // Prevent pushing duplicate if polling already fetched it
          if (!state.messages.any((m) => m.id == newMessage.id)) {
            state = state.copyWith(
              messages: [...state.messages, newMessage],
            );
          }
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> markAsSeen() async {
    try {
      await http.put(
        Uri.parse('$kBaseUrl/api/chat/$orderId/seen'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'viewerRole': 'client'}),
      );
    } catch (e) {
      // ignore
    }
  }
}

final chatProvider = StateNotifierProvider.autoDispose.family<ChatNotifier, ChatState, String>((ref, orderId) {
  return ChatNotifier(orderId, ref);
});
