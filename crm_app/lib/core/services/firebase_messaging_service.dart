import 'dart:developer';
import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/port.dart';

/// Top-level function to handle background messages.
/// It must be annotated with `@pragma('vm:entry-point')` so the Dart VM doesn't strip it out
/// and it can be executed in a separate isolate when the app is in the background or terminated.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Ensure Firebase is initialized in the background isolate before doing anything.
  await Firebase.initializeApp();
  log('Handling a background message: ${message.messageId}', name: 'FCM Background');
}

/// A dedicated service class to handle Firebase Cloud Messaging (FCM) and Local Notifications.
class FirebaseMessagingService {
  // Create an instance of FirebaseMessaging.
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  // Create an instance of FlutterLocalNotificationsPlugin.
  final FlutterLocalNotificationsPlugin _localNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  /// Initialize the service, request permissions, and set up listeners.
  Future<void> initialize() async {
    // 1. Request permission (required for iOS and Android 13+).
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      log('User granted permission', name: 'FCM');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      log('User granted provisional permission', name: 'FCM');
    } else {
      log('User declined or has not accepted permission', name: 'FCM');
    }

    // 2. Retrieve the FCM token. This token can be sent to your Node.js backend.
    try {
      String? token = await _firebaseMessaging.getToken();
      log('FCM Token: $token', name: 'FCM Token');
      if (token != null) {
        await _sendTokenToServer(token);
      }
    } catch (e) {
      log('Failed to get FCM token: $e', name: 'FCM Error');
    }

    // Listen for token refreshes.
    _firebaseMessaging.onTokenRefresh.listen((newToken) {
      log('FCM Token Refreshed: $newToken', name: 'FCM Token Refresh');
      _sendTokenToServer(newToken);
    });

    // 3. Initialize Local Notifications (to show notifications while the app is in foreground).
    await _initializeLocalNotifications();

    // 4. Set up the background message handler.
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 5. Set up foreground and background listeners.
    _setupMessageListeners();
  }

  /// Sends the FCM token to the backend API.
  Future<void> _sendTokenToServer(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final uid = prefs.getString('auth_uid');

      if (uid == null || uid.isEmpty) {
        log('User not logged in. Skipping token sync.', name: 'FCM Sync');
        return;
      }

      final url = Uri.parse('$kBaseUrl/api/notifications/fcm-token');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid,
        },
        body: jsonEncode({'token': token}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        log('Successfully sent token to server.', name: 'FCM Sync');
      } else {
        log('Failed to send token to server. Status: ${response.statusCode}', name: 'FCM Sync Error');
      }
    } catch (e) {
      log('Error syncing token to server: $e', name: 'FCM Sync Error');
    }
  }

  /// Initializes the flutter_local_notifications plugin.
  Future<void> _initializeLocalNotifications() async {
    // Configure initialization settings for Android. (Make sure you have an icon named 'ic_launcher' or 'mipmap/ic_launcher')
    const AndroidInitializationSettings androidInitSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // Combine initialization settings.
    const InitializationSettings initSettings = InitializationSettings(
      android: androidInitSettings,
      // Add iOS initialization settings here if you configure iOS in the future.
    );

    await _localNotificationsPlugin.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle when a user taps on a local notification shown while the app was in the foreground.
        log('Local Notification Tapped with payload: ${response.payload}', name: 'FCM Tap');
      },
    );
  }

  /// Sets up listeners for foreground messages and app opens.
  void _setupMessageListeners() {
    // A. Listen for messages when the app is in the FOREGROUND.
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      log('Received a message in foreground: ${message.messageId}', name: 'FCM Foreground');

      if (message.notification != null) {
        log('Message also contained a notification: ${message.notification?.title}', name: 'FCM Foreground');
        
        // Show the notification locally since FCM doesn't automatically show it when the app is in the foreground.
        _showLocalNotification(message);
      }
    });

    // B. Listen for when a user taps a notification that opened the app from the BACKGROUND.
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log('Message clicked! App opened from background.', name: 'FCM Tap');
      // Navigate to a specific screen based on message data if needed.
    });

    // C. Check if the app was opened from a TERMINATED state via a notification tap.
    _firebaseMessaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        log('App opened from terminated state via notification!', name: 'FCM Tap');
        // Handle navigation or logic here.
      }
    });
  }

  /// Helper to display a local notification.
  Future<void> _showLocalNotification(RemoteMessage message) async {
    // Define Android-specific notification details (e.g., high importance so it pops up).
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'high_importance_channel', // Channel ID
      'High Importance Notifications', // Channel Name
      channelDescription: 'This channel is used for important notifications.',
      importance: Importance.max,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
    );

    await _localNotificationsPlugin.show(
      id: message.notification?.hashCode ?? 0, // Unique ID for the notification
      title: message.notification?.title,         // Notification Title
      body: message.notification?.body,          // Notification Body
      notificationDetails: platformDetails,
      payload: message.data.toString(),    // Pass any additional data as a payload
    );
  }
}
