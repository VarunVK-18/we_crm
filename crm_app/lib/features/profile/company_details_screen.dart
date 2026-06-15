import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';

class _EntityExpandableCard extends StatefulWidget {
  final ClientEntity entity;
  const _EntityExpandableCard({required this.entity});

  @override
  State<_EntityExpandableCard> createState() => _EntityExpandableCardState();
}

class _EntityExpandableCardState extends State<_EntityExpandableCard> {
  bool _isExpanded = true;
  int _selectedTabIndex = 0;

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

  Widget _buildDetailCard(String label, String value, BuildContext context) {
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
        _buildDetailCard('Certificate of Incorporation (COI)', widget.entity.coi, context),
        _buildDetailCard('Digital Signature Certificate (DSC)', widget.entity.dsc, context),
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
          Text('Trademark', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
          const SizedBox(height: 12),
          _buildDetailCard('Application Number', widget.entity.trademarkApplicationNumber, context),
          _buildDetailCard('Status', widget.entity.trademarkStatus, context),
          _buildDetailCard('Certificate', widget.entity.trademarkCertificate, context),
          const SizedBox(height: 24),
        ],
        
        if (widget.entity.patentApplicationNumber.isNotEmpty || widget.entity.patentStatus.isNotEmpty) ...[
          Text('Patent', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
          const SizedBox(height: 12),
          _buildDetailCard('Application Number', widget.entity.patentApplicationNumber, context),
          _buildDetailCard('Status', widget.entity.patentStatus, context),
          _buildDetailCard('Patent Number', widget.entity.patentNumber, context),
          const SizedBox(height: 24),
        ],
        
        if (widget.entity.copyrightRegistrationNumber.isNotEmpty) ...[
          Text('Copyright', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
          const SizedBox(height: 12),
          _buildDetailCard('Registration Number', widget.entity.copyrightRegistrationNumber, context),
          _buildDetailCard('Certificate', widget.entity.copyrightCertificate, context),
          const SizedBox(height: 24),
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
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
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
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
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
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _selectedTabIndex = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _selectedTabIndex == 0 ? AppTheme.deepTeal : Colors.grey.shade200,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Incorporation Details',
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: _selectedTabIndex == 0 ? AppTheme.deepTeal : Colors.grey[500],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _selectedTabIndex = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _selectedTabIndex == 1 ? AppTheme.deepTeal : Colors.grey.shade200,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Application Tracker',
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: _selectedTabIndex == 1 ? AppTheme.deepTeal : Colors.grey[500],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            // Content
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: _selectedTabIndex == 0 
                  ? _buildIncorporationDetails(context) 
                  : _buildApplicationTracker(context),
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
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.deepTeal),
      ),
      body: userAsync.when(
        data: (user) {
          if (user == null || user.clientEntities.isEmpty) {
            return Center(
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
                    'Your filing staff hasn\'t uploaded\nentity details yet.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: user.clientEntities.length,
            itemBuilder: (context, index) {
              final entity = user.clientEntities[index];
              return _EntityExpandableCard(entity: entity);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF312E81))),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
