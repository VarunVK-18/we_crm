import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';

class CompanyDetailsScreen extends ConsumerStatefulWidget {
  const CompanyDetailsScreen({super.key});

  @override
  ConsumerState<CompanyDetailsScreen> createState() => _CompanyDetailsScreenState();
}

class _CompanyDetailsScreenState extends ConsumerState<CompanyDetailsScreen> {
  ClientEntity? _selectedEntity;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(userProfileProvider).value;
      if (user != null && user.clientEntities.isNotEmpty) {
        setState(() {
          _selectedEntity = user.clientEntities.first;
        });
      }
    });
  }

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

          if (_selectedEntity == null) {
            _selectedEntity = user.clientEntities.first;
          }

          return DefaultTabController(
            length: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (user.clientEntities.length > 1)
                  Padding(
                    padding: const EdgeInsets.all(20).copyWith(bottom: 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<ClientEntity>(
                          value: _selectedEntity,
                          isExpanded: true,
                          icon: const Icon(Icons.arrow_drop_down, color: AppTheme.deepTeal),
                          items: user.clientEntities.map((ent) {
                            return DropdownMenuItem<ClientEntity>(
                              value: ent,
                              child: Text(
                                ent.entityName,
                                style: GoogleFonts.outfit(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.deepTeal,
                                ),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedEntity = val);
                            }
                          },
                        ),
                      ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.all(20).copyWith(bottom: 0),
                    child: Text(
                      _selectedEntity!.entityName,
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                  ),
                
                const SizedBox(height: 16),
                Container(
                  color: Colors.white,
                  child: TabBar(
                    labelColor: AppTheme.deepTeal,
                    unselectedLabelColor: Colors.grey[500],
                    indicatorColor: AppTheme.deepTeal,
                    indicatorWeight: 3,
                    labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
                    tabs: const [
                      Tab(text: 'Incorporation Details'),
                      Tab(text: 'Application Tracker'),
                    ],
                  ),
                ),
                
                Expanded(
                  child: TabBarView(
                    children: [
                      // Incorporation Details Tab
                      SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildDetailCard('CIN (Corporate Identification Number)', _selectedEntity!.cin, context),
                            _buildDetailCard('PAN (Permanent Account Number)', _selectedEntity!.pan, context),
                            _buildDetailCard('TAN (Tax Deduction and Collection Account Number)', _selectedEntity!.tan, context),
                            _buildDetailCard('Certificate of Incorporation (COI)', _selectedEntity!.coi, context),
                            _buildDetailCard('Digital Signature Certificate (DSC)', _selectedEntity!.dsc, context),
                            if (_selectedEntity!.cin.isEmpty && _selectedEntity!.pan.isEmpty && _selectedEntity!.tan.isEmpty && _selectedEntity!.coi.isEmpty && _selectedEntity!.dsc.isEmpty)
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
                        ),
                      ),
                      
                      // Application Tracker Tab
                      SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_selectedEntity!.trademarkApplicationNumber.isNotEmpty || _selectedEntity!.trademarkStatus.isNotEmpty) ...[
                              Text('Trademark', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                              const SizedBox(height: 12),
                              _buildDetailCard('Application Number', _selectedEntity!.trademarkApplicationNumber, context),
                              _buildDetailCard('Status', _selectedEntity!.trademarkStatus, context),
                              _buildDetailCard('Certificate', _selectedEntity!.trademarkCertificate, context),
                              const SizedBox(height: 24),
                            ],
                            
                            if (_selectedEntity!.patentApplicationNumber.isNotEmpty || _selectedEntity!.patentStatus.isNotEmpty) ...[
                              Text('Patent', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                              const SizedBox(height: 12),
                              _buildDetailCard('Application Number', _selectedEntity!.patentApplicationNumber, context),
                              _buildDetailCard('Status', _selectedEntity!.patentStatus, context),
                              _buildDetailCard('Patent Number', _selectedEntity!.patentNumber, context),
                              const SizedBox(height: 24),
                            ],
                            
                            if (_selectedEntity!.copyrightRegistrationNumber.isNotEmpty) ...[
                              Text('Copyright', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.deepTeal)),
                              const SizedBox(height: 12),
                              _buildDetailCard('Registration Number', _selectedEntity!.copyrightRegistrationNumber, context),
                              _buildDetailCard('Certificate', _selectedEntity!.copyrightCertificate, context),
                              const SizedBox(height: 24),
                            ],
                            
                            if (_selectedEntity!.trademarkApplicationNumber.isEmpty && 
                                _selectedEntity!.patentApplicationNumber.isEmpty && 
                                _selectedEntity!.copyrightRegistrationNumber.isEmpty)
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
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF312E81))),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
