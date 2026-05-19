import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';

class NameCheckScreen extends StatefulWidget {
  const NameCheckScreen({super.key});

  @override
  State<NameCheckScreen> createState() => _NameCheckScreenState();
}

class _NameCheckScreenState extends State<NameCheckScreen> {
  late TextEditingController _controller;
  Timer? _debounce;
  bool _isChecking = false;
  String? _statusMessage;
  String? _finalResult;
  Color _statusColor = AppTheme.deepTeal;
  IconData _statusIcon = LucideIcons.search;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
    _controller.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      if (_controller.text.trim().length > 3) {
        _performRealTimeCheck(_controller.text.trim());
      } else {
        setState(() {
          _isChecking = false;
          _statusMessage = null;
          _finalResult = null;
        });
      }
    });
  }

  void _performRealTimeCheck(String name) async {
    setState(() {
      _isChecking = true;
      _statusMessage = 'Analyzing brand availability...';
      _statusColor = AppTheme.corporateBlue;
      _statusIcon = LucideIcons.loader2;
      _finalResult = null;
    });

    // Simulate "Real-Time" search latency
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    final upperName = name.toUpperCase();

    setState(() {
      _isChecking = false;

      // Smart Mock Logic
      if (upperName.contains('INDIA') ||
          upperName.contains('NATIONAL') ||
          upperName.contains('GOVT')) {
        _statusMessage = 'Restricted Term Detected';
        _finalResult =
            'Names containing "$upperName" may require central government approval.';
        _statusColor = Colors.orange;
        _statusIcon = LucideIcons.alertTriangle;
      } else if (upperName.length < 5) {
        _statusMessage = 'Name Too Short';
        _finalResult =
            'Company names must be unique and descriptive. Try adding more detail.';
        _statusColor = Colors.red;
        _statusIcon = LucideIcons.xCircle;
      } else if (upperName.contains('STEEL') || upperName.contains('INFRA')) {
        _statusMessage = 'Potential Match Found';
        _finalResult =
            'A similar name might already be registered in the MCA database.';
        _statusColor = Colors.red;
        _statusIcon = LucideIcons.info;
      } else {
        _statusMessage = 'Looks Available!';
        _finalResult = '"$upperName" appears to be available for registration.';
        _statusColor = Colors.green;
        _statusIcon = LucideIcons.checkCircle2;
      }
    });
  }

  Future<void> _launchMCAPortal() async {
    final url = Uri.parse(
      'https://www.mca.gov.in/content/mca/global/en/mca/fo-llp-services/company-llp-name-search.html',
    );
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Name Availability',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reserve your brand name',
              style: GoogleFonts.outfit(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Search the MCA database in real-time to find your perfect company name.',
              style: GoogleFonts.outfit(
                color: Colors.grey.shade600,
                fontSize: 15,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.deepTeal.withOpacity(0.08),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: TextField(
                controller: _controller,
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepTeal,
                ),
                decoration: InputDecoration(
                  hintText: 'Enter brand name...',
                  hintStyle: GoogleFonts.outfit(
                    color: Colors.grey.shade400,
                    fontWeight: FontWeight.w500,
                  ),
                  border: InputBorder.none,
                  suffixIcon: _isChecking
                      ? Container(
                          width: 20,
                          height: 20,
                          padding: const EdgeInsets.all(12),
                          child: const CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppTheme.corporateBlue,
                            ),
                          ),
                        )
                      : Icon(LucideIcons.search, color: Colors.grey.shade400),
                ),
                textCapitalization: TextCapitalization.characters,
              ),
            ),

            if (_statusMessage != null) ...[
              const SizedBox(height: 24),
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: _statusColor.withOpacity(0.15),
                    width: 1.5,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(_statusIcon, color: _statusColor, size: 24),
                        const SizedBox(width: 12),
                        Text(
                          _statusMessage!,
                          style: GoogleFonts.outfit(
                            color: _statusColor,
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                    if (_finalResult != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _finalResult!,
                        style: GoogleFonts.outfit(
                          color: Colors.grey.shade700,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _launchMCAPortal,
                          icon: const Icon(LucideIcons.externalLink, size: 16),
                          label: const Text('Verify on Official MCA Portal'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.deepTeal,
                            side: BorderSide(color: Colors.grey.shade300),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
