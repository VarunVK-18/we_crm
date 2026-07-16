import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';
import 'package:url_launcher/url_launcher.dart';

class _EntityExpandableCard extends StatefulWidget {
  final ClientEntity entity;
  const _EntityExpandableCard({required this.entity});

  @override
  State<_EntityExpandableCard> createState() => _EntityExpandableCardState();
}

class _EntityExpandableCardState extends State<_EntityExpandableCard> {
  bool _isExpanded = false;
  int _selectedTabIndex = 0;
  
  bool _isTrademarkExpanded = false;
  bool _isPatentExpanded = false;
  bool _isCopyrightExpanded = false;

  void _copyToClipboard(BuildContext context, String label, String text) {
    if (text.isEmpty) return;
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard', style: GoogleFonts.outfit()),
        backgroundColor: const Color(0xFF312E81),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Widget _buildDetailCard(String label, String value, BuildContext context, {bool isTrackable = false, bool showCopy = true}) {
    if (value.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.outfit(
                    color: Colors.grey[600],
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    color: AppTheme.deepTeal,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (isTrackable)
            TextButton.icon(
              onPressed: () async {
                final url = Uri.parse('https://ipindia.gov.in/');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              },
              icon: const Icon(Icons.track_changes_rounded, size: 16, color: AppTheme.deepTeal),
              label: Text('Track', style: GoogleFonts.outfit(color: AppTheme.deepTeal, fontSize: 12)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                backgroundColor: AppTheme.deepTeal.withOpacity(0.1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            )
          else if (showCopy)
            IconButton(
              onPressed: () => _copyToClipboard(context, label, value),
              icon: const Icon(Icons.copy_rounded, color: Color(0xFF312E81), size: 20),
              tooltip: 'Copy $label',
            )
        ],
      ),
    );
  }

  Widget _buildIncorporationDetails(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailCard('CIN (Corporate Identification Number)', widget.entity.cin, context),
        _buildDetailCard('Incorporation Date', widget.entity.incorporationDate != null ? DateFormat('dd MMM yyyy').format(widget.entity.incorporationDate!) : '', context),
        _buildDetailCard('PAN (Permanent Account Number)', widget.entity.pan, context),
        _buildDetailCard('TAN (Tax Deduction and Collection Account Number)', widget.entity.tan, context),
        _buildDetailCard('Certificate of Incorporation (COI)', widget.entity.coi, context, showCopy: false),
        _buildDetailCard('Digital Signature Certificate (DSC)', widget.entity.dsc, context, showCopy: false),
        if (widget.entity.cin.isEmpty && widget.entity.pan.isEmpty && widget.entity.tan.isEmpty && widget.entity.coi.isEmpty && widget.entity.dsc.isEmpty && widget.entity.incorporationDate == null)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Text(
                'No incorporation details available.',
                style: GoogleFonts.outfit(color: Colors.grey[500]),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildApplicationTracker(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.entity.trademarkApplicationNumber.isNotEmpty || widget.entity.trademarkStatus.isNotEmpty) ...[
          InkWell(
            onTap: () => setState(() => _isTrademarkExpanded = !_isTrademarkExpanded),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Trademark', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                  Icon(_isTrademarkExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: AppTheme.deepTeal),
                ],
              ),
            ),
          ),
          if (_isTrademarkExpanded) ...[
            const SizedBox(height: 12),
            _buildDetailCard('Trademark Number', widget.entity.trademarkApplicationNumber, context),
            _buildDetailCard('Status', widget.entity.trademarkStatus, context, isTrackable: true),
            _buildDetailCard('Certificate', widget.entity.trademarkCertificate, context, showCopy: false),
          ],
          const SizedBox(height: 16),
        ],
        
        if (widget.entity.patentApplicationNumber.isNotEmpty || widget.entity.patentStatus.isNotEmpty) ...[
          InkWell(
            onTap: () => setState(() => _isPatentExpanded = !_isPatentExpanded),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Patent', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                  Icon(_isPatentExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: AppTheme.deepTeal),
                ],
              ),
            ),
          ),
          if (_isPatentExpanded) ...[
            const SizedBox(height: 12),
            _buildDetailCard('Patent Number', widget.entity.patentApplicationNumber, context),
            _buildDetailCard('Status', widget.entity.patentStatus, context, isTrackable: true),
            _buildDetailCard('Patent Number', widget.entity.patentNumber, context),
          ],
          const SizedBox(height: 16),
        ],
        
        if (widget.entity.copyrightRegistrationNumber.isNotEmpty) ...[
          InkWell(
            onTap: () => setState(() => _isCopyrightExpanded = !_isCopyrightExpanded),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Copyright', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                  Icon(_isCopyrightExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: AppTheme.deepTeal),
                ],
              ),
            ),
          ),
          if (_isCopyrightExpanded) ...[
            const SizedBox(height: 12),
            _buildDetailCard('Registration Number', widget.entity.copyrightRegistrationNumber, context),
            _buildDetailCard('Certificate', widget.entity.copyrightCertificate, context, showCopy: false),
          ],
          const SizedBox(height: 16),
        ],
        
        if (widget.entity.trademarkApplicationNumber.isEmpty && 
            widget.entity.patentApplicationNumber.isEmpty && 
            widget.entity.copyrightRegistrationNumber.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Text(
                'No tracked applications available.',
                style: GoogleFonts.outfit(color: Colors.grey[500]),
              ),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: Colors.white,
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header (Click to expand/collapse)
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      widget.entity.entityName,
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                  ),
                  Icon(
                    _isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    color: AppTheme.deepTeal,
                  ),
                ],
              ),
            ),
          ),
          
          if (_isExpanded) ...[
            // Tabs
            Stack(
              children: [
                // Base background border
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    height: 2,
                    color: Colors.grey.shade200,
                  ),
                ),
                // Tabs
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _selectedTabIndex = 0),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 300),
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: _selectedTabIndex == 0 ? AppTheme.deepTeal : Colors.grey[500],
                              ),
                              child: const Text('Incorporation Details'),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _selectedTabIndex = 1),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Center(
                            child: AnimatedDefaultTextStyle(
                              duration: const Duration(milliseconds: 300),
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: _selectedTabIndex == 1 ? AppTheme.deepTeal : Colors.grey[500],
                              ),
                              child: const Text('Application Tracker'),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                // Animated Indicator Line
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return AnimatedAlign(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutCubic,
                        alignment: _selectedTabIndex == 0 ? Alignment.centerLeft : Alignment.centerRight,
                        child: Container(
                          width: constraints.maxWidth / 2,
                          height: 2,
                          color: AppTheme.deepTeal,
                        ),
                      );
                    }
                  ),
                ),
              ],
            ),
            
            // Content
            GestureDetector(
              onHorizontalDragEnd: (details) {
                // Determine swipe direction based on velocity
                if (details.primaryVelocity != null) {
                  if (details.primaryVelocity! > 0) {
                    // Swiped Right -> Go to Incorporation Details (index 0)
                    if (_selectedTabIndex == 1) {
                      setState(() => _selectedTabIndex = 0);
                    }
                  } else if (details.primaryVelocity! < 0) {
                    // Swiped Left -> Go to Application Tracker (index 1)
                    if (_selectedTabIndex == 0) {
                      setState(() => _selectedTabIndex = 1);
                    }
                  }
                }
              },
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (Widget child, Animation<double> animation) {
                    final isTab0 = (child.key as ValueKey<int>).value == 0;
                    final slideAnimation = Tween<Offset>(
                      begin: Offset(isTab0 ? -0.5 : 0.5, 0.0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
                    
                    return FadeTransition(
                      opacity: animation,
                      child: SlideTransition(
                        position: slideAnimation,
                        child: child,
                      ),
                    );
                  },
                  child: _selectedTabIndex == 0 
                      ? Container(key: const ValueKey(0), child: _buildIncorporationDetails(context)) 
                      : Container(key: const ValueKey(1), child: _buildApplicationTracker(context)),
                ),
              ),
            ),
          ]
        ],
      ),
    );
  }
}

class CompanyDetailsScreen extends ConsumerStatefulWidget {
  const CompanyDetailsScreen({super.key});

  @override
  ConsumerState<CompanyDetailsScreen> createState() => _CompanyDetailsScreenState();
}

class _CompanyDetailsScreenState extends ConsumerState<CompanyDetailsScreen> {
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    // Auto-refresh data every 5 seconds when screen is active
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (mounted) {
        ref.invalidate(userProfileProvider);
      }
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: Text(
          'Company Details',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.deepTeal),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: () {
                ref.invalidate(userProfileProvider);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Refreshing details...'),
                    duration: Duration(seconds: 1),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              tooltip: 'Refresh',
            ),
          ),
        ],
      ),
      body: userAsync.when(
        data: (user) {
          if (user == null || user.clientEntities.isEmpty) {
            return RefreshIndicator(
              color: AppTheme.deepTeal,
              onRefresh: () async {
                ref.invalidate(userProfileProvider);
                await Future.delayed(const Duration(milliseconds: 500));
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.6,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.business_rounded, size: 64, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text(
                            'No Entities Found',
                            style: GoogleFonts.outfit(
                              color: AppTheme.deepTeal,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Your filing staff hasn\'t uploaded\nentity details yet.\nPull down to refresh.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: AppTheme.deepTeal,
            onRefresh: () async {
              ref.invalidate(userProfileProvider);
              // Small delay to let the UI show the refresh spinner
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              itemCount: user.clientEntities.length,
              itemBuilder: (context, index) {
                final entity = user.clientEntities[index];
                return _EntityExpandableCard(entity: entity);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF312E81))),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
