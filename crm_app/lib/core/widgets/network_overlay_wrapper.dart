import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import '../../providers/network_provider.dart';
import '../constants/port.dart';
import '../theme/app_theme.dart';
import 'package:crm_app/core/utils/error_handler.dart';

class NetworkOverlayWrapper extends ConsumerStatefulWidget {
  final Widget child;
  const NetworkOverlayWrapper({super.key, required this.child});

  @override
  ConsumerState<NetworkOverlayWrapper> createState() => _NetworkOverlayWrapperState();
}

class _NetworkOverlayWrapperState extends ConsumerState<NetworkOverlayWrapper> {
  bool _wasOffline = false;
  bool _isConnectingToServer = false;
  bool _serverConnected = false;

  @override
  void initState() {
    super.initState();
    _checkServerStatus();
  }

  Future<void> _checkServerStatus() async {
    if (_serverConnected) return; // already connected

    // Give it 2 seconds, if not responded by then, show connecting banner
    Timer(const Duration(seconds: 2), () {
      if (!_serverConnected && mounted) {
        setState(() {
          _isConnectingToServer = true;
        });
      }
    });

    try {
      // Just a simple ping to wake up the server if it's asleep
      // Using a quick timeout to check if it's fast
      await http.get(Uri.parse('$kBaseUrl/api/auth/health-check')).timeout(const Duration(seconds: 40));
      
      if (mounted) {
        setState(() {
          _serverConnected = true;
          _isConnectingToServer = false;
        });
      }
    } catch (e) {
      showGlobalError(e);
      // Might be offline, let the network provider handle offline UI
      if (mounted) {
        setState(() {
          _isConnectingToServer = false; 
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final networkStatus = ref.watch(networkProvider);

    // Track state to show "Back to connection"
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (networkStatus == NetworkStatus.offline) {
        _wasOffline = true;
      } else if (networkStatus == NetworkStatus.online && _wasOffline) {
        _wasOffline = false;
        _showBackOnlineSnackbar();
        // Since we are back online, ping server again
        _checkServerStatus();
      }
    });

    final isOffline = networkStatus == NetworkStatus.offline;

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Stack(
        children: [
          widget.child,
          if (isOffline)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                bottom: false,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                    color: Colors.redAccent,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.wifiOff, color: Colors.white, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'No Internet Connection',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          if (!isOffline && _isConnectingToServer)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                bottom: false,
                child: Material(
                  color: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                    color: AppTheme.corporateBlue,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Connecting to server...',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showBackOnlineSnackbar() {
    // Need a messenger context, we can use a global overlay or snackbar, but here we can just show a temporary banner in stack by setting state, or if we have ScaffoldMessenger key, we use it. 
    // Wait, the builder doesn't have a ScaffoldMessenger context easily unless we pass a global key.
    // So let's just use a top-level overlay state, or just let the banner disappear and show a temporary floating overlay.
    // For simplicity, we can use the root navigator's overlay.
    final overlay = Overlay.of(context);
    final entry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 10,
        left: 16,
        right: 16,
        child: Material(
          color: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.wifi, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  'Back to connection',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    overlay.insert(entry);
    Timer(const Duration(seconds: 3), () {
      entry.remove();
    });
  }
}
