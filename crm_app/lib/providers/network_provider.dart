import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';

enum NetworkStatus { online, offline, checking }

class NetworkNotifier extends StateNotifier<NetworkStatus> {
  late StreamSubscription _connectivitySubscription;
  final Connectivity _connectivity = Connectivity();

  NetworkNotifier() : super(NetworkStatus.checking) {
    _init();
  }

  Future<void> _init() async {
    // Check initial state
    final results = await _connectivity.checkConnectivity();
    await _checkInternet(results);

    // Listen to changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(_checkInternet);
  }

  Future<void> _checkInternet(List<ConnectivityResult> results) async {
    if (results.contains(ConnectivityResult.none)) {
      state = NetworkStatus.offline;
    } else {
      // Actually check internet reachability
      bool isConnected = await InternetConnectionChecker.instance.hasConnection;
      state = isConnected ? NetworkStatus.online : NetworkStatus.offline;
    }
  }

  @override
  void dispose() {
    _connectivitySubscription.cancel();
    super.dispose();
  }
}

final networkProvider = StateNotifierProvider<NetworkNotifier, NetworkStatus>((ref) {
  return NetworkNotifier();
});
