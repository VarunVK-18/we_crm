import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/service_documents.dart';
import 'service_request_summary_sheet.dart';

class ServiceDetailScreen extends StatelessWidget {
  final String serviceName;
  final dynamic icon;
  final String description;
  final List<String> features;

  const ServiceDetailScreen({
    super.key,
    required this.serviceName,
    required this.icon,
    this.description = 'Complete professional assistance for your requirements.', // Default
    this.features = const [
      'Expert Consultation',
      'Document Verification',
      'Priority Processing',
      'Statutory Compliance',
    ], // Default
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // 1. Scrollable Content
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // Header
              SliverAppBar(
                expandedHeight: 240,
                pinned: true,
                elevation: 0,
                systemOverlayStyle: SystemUiOverlayStyle.light,
                backgroundColor: AppTheme.deepTeal,
                leading: IconButton(
                  icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.deepTeal,
                          AppTheme.corporateBlue.withValues(alpha: 0.8)
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),
                        // Themed Icon Container
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.2)),
                          ),
                          child: icon is IconData
                              ? Icon(icon as IconData,
                                  color: Colors.white, size: 48)
                              : HugeIcon(
                                  icon: icon, color: Colors.white, size: 48),
                        ),
                        const SizedBox(height: 16),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            serviceName,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Content
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // About Package
                      const Text(
                        'About Package',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        description,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 15,
                          height: 1.6,
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Included Features
                      const Text(
                        'Included Features',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ...features.map((feature) => _FeatureItem(title: feature)),

                      // Required Documents (Dynamic)
                      if (kServiceRequiredDocuments.containsKey(serviceName)) ...[
                        const SizedBox(height: 32),
                        const Text(
                          'Required Documents',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.deepTeal,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'The following documents are needed to process this request:',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 10,
                          children: kServiceRequiredDocuments[serviceName]!
                              .map((doc) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                          color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(LucideIcons.fileText,
                                            size: 14,
                                            color: AppTheme.corporateBlue),
                                        const SizedBox(width: 8),
                                        Text(
                                          doc,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: AppTheme.deepTeal,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ))
                              .toList(),
                        ),
                      ],

                      const SizedBox(height: 100), // Space for bottom button
                    ],
                  ),
                ),
              ),
            ],
          ),

          // 2. Sticky Bottom Action
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    offset: const Offset(0, -10),
                    blurRadius: 20,
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (context) => ServiceRequestSummarySheet(
                      packageName: serviceName,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.activeOrange,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 60),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Request Quote',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final String title;
  const _FeatureItem({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Color(0xFFDCFCE7), // Light green
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.check, color: Color(0xFF16A34A), size: 14),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepTeal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
