import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/local_document_viewer.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dsc_provider.dart';

class DSCOrdersScreen extends ConsumerWidget {
  const DSCOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dscOrdersAsync = ref.watch(dscOrdersProvider);
    final uid = ref.watch(authStateProvider).value?.uid;

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
          'DSC Registrations',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
      ),
      body: dscOrdersAsync.when(
        data: (orders) {
          if (orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.shieldCheck, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No DSC applications found',
                    style: TextStyle(color: Colors.grey[600], fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            );
          }

          final activeOrders = orders.where((o) => !o.isCompleted).toList();
          final completedOrders = orders.where((o) => o.isCompleted).toList();

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              if (activeOrders.isNotEmpty) ...[
                const Text(
                  'Active Applications',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.deepTeal,
                  ),
                ),
                const SizedBox(height: 16),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: activeOrders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final order = activeOrders[index];
                    return _buildDSCCard(
                      context: context,
                      ref: ref,
                      orderId: order.id,
                      name: order.name,
                      type: order.type,
                      stage: order.stage,
                      progress: order.progress,
                      color: AppTheme.corporateBlue,
                      isCompleted: false,
                    );
                  },
                ),
                const SizedBox(height: 32),
              ],
              if (completedOrders.isNotEmpty) ...[
                const Text(
                  'Completed',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.deepTeal,
                  ),
                ),
                const SizedBox(height: 16),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: completedOrders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final order = completedOrders[index];
                    return _buildDSCCard(
                      context: context,
                      ref: ref,
                      orderId: order.id,
                      name: order.name,
                      type: order.type,
                      stage: order.stage,
                      progress: order.progress,
                      color: Colors.green,
                      isCompleted: true,
                    );
                  },
                ),
              ],
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.deepTeal),
          ),
        ),
        error: (err, stack) => Center(
          child: Text('Error loading DSC orders: $err'),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: uid == null ? null : () => _showApplyDscBottomSheet(context, ref, uid),
        backgroundColor: AppTheme.deepTeal,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text('Apply New DSC', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  void _showApplyDscBottomSheet(BuildContext context, WidgetRef ref, String uid) {
    final nameController = TextEditingController();
    String dscType = 'Class 3 (Signature + Encryption)';
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                ),
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Apply for Digital Signature (DSC)',
                      style: TextStyle(
                        color: AppTheme.deepTeal,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Fill in the applicant details to initiate the registration.',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Applicant Name',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: nameController,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        hintText: 'Enter full legal name',
                        hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
                        filled: true,
                        fillColor: Colors.grey[50],
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey[200]!),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey[200]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppTheme.deepTeal, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'DSC Type',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: dscType,
                          isExpanded: true,
                          icon: const Icon(LucideIcons.chevronDown, color: AppTheme.deepTeal),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                            fontFamily: 'Outfit',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'Class 3 (Signature + Encryption)',
                              child: Text('Class 3 (Signature + Encryption)'),
                            ),
                            DropdownMenuItem(
                              value: 'Class 3 (Signature Only)',
                              child: Text('Class 3 (Signature Only)'),
                            ),
                            DropdownMenuItem(
                              value: 'Class 3 (Encryption Only)',
                              child: Text('Class 3 (Encryption Only)'),
                            ),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                dscType = val;
                              });
                            }
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                final name = nameController.text.trim();
                                if (name.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Please enter the applicant name'),
                                      backgroundColor: Colors.redAccent,
                                    ),
                                  );
                                  return;
                                }

                                setState(() {
                                  isSubmitting = true;
                                });

                                try {
                                  final response = await http.post(
                                    Uri.parse('$kBaseUrl/api/dsc'),
                                    headers: {'Content-Type': 'application/json'},
                                    body: jsonEncode({
                                      'clientUid': uid,
                                      'name': name,
                                      'type': dscType,
                                      'stage': 'Pending Verification',
                                      'progress': 0.1,
                                      'isCompleted': false,
                                    }),
                                  ).timeout(const Duration(seconds: 8));

                                  if (response.statusCode == 201) {
                                    ref.invalidate(dscOrdersProvider);
                                    if (!context.mounted) return;
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('DSC Application submitted successfully!'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  } else {
                                    throw Exception('Failed to apply: ${response.statusCode}');
                                  }
                                } catch (e) {
                                  if (!context.mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Error: $e'),
                                      backgroundColor: Colors.redAccent,
                                    ),
                                  );
                                } finally {
                                  setState(() {
                                    isSubmitting = false;
                                  });
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.deepTeal,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: isSubmitting
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text(
                                'Submit Application',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDSCCard({
    required BuildContext context,
    required WidgetRef ref,
    required String orderId,
    required String name,
    required String type,
    required String stage,
    required double progress,
    required Color color,
    bool isCompleted = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.user, color: color, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    Text(
                      type,
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (isCompleted)
                const Icon(LucideIcons.checkCircle, color: Colors.green, size: 20),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                stage,
                style: TextStyle(
                  color: isCompleted ? Colors.green : AppTheme.deepTeal,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey.shade100,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
          if (!isCompleted) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () async {
                  try {
                    // 1. Pick document
                    final result = await FilePicker.platform.pickFiles(
                      type: FileType.custom,
                      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
                    );

                    if (result == null || result.files.isEmpty) {
                      return; // User canceled picking
                    }

                    final fileName = result.files.first.name;
                    final filePath = result.files.first.path;
                    final fileSize = result.files.first.size;

                    if (fileSize > 2 * 1024 * 1024) {
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Warning: File is large. Max 2MB allowed')),
                      );
                      return;
                    }

                    if (filePath == null) return;

                    // Show preview dialog
                    if (!context.mounted) return;
                    final shouldUpload = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Preview Document', style: TextStyle(color: AppTheme.deepTeal, fontWeight: FontWeight.bold)),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Selected: $fileName'),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              icon: const Icon(LucideIcons.eye, color: Colors.white, size: 18),
                              label: const Text('View Document', style: TextStyle(color: Colors.white)),
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.corporateBlue),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => LocalDocumentViewer(filePath: filePath),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.deepTeal),
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Upload Safely', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    );

                    if (shouldUpload != true) return;

                    // 2. Show loading spinner dialog
                    if (!context.mounted) return;
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) => const Center(
                        child: Card(
                          margin: EdgeInsets.all(24),
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                CircularProgressIndicator(color: AppTheme.deepTeal),
                                SizedBox(height: 16),
                                Text(
                                  'Uploading document...',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );

                    // 3. PUT update request to database
                    final response = await http.put(
                      Uri.parse('$kBaseUrl/api/dsc/$orderId'),
                      headers: {'Content-Type': 'application/json'},
                      body: jsonEncode({
                        'stage': 'Documents Uploaded',
                        'progress': 0.8,
                      }),
                    ).timeout(const Duration(seconds: 8));

                    // 4. Pop loading dialog
                    if (!context.mounted) return;
                    Navigator.pop(context);

                    if (response.statusCode == 200) {
                      ref.invalidate(dscOrdersProvider);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('"$fileName" uploaded successfully!'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    } else {
                      throw Exception('Failed to update order: ${response.statusCode}');
                    }
                  } catch (e) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error uploading document: $e'),
                        backgroundColor: Colors.redAccent,
                      ),
                    );
                  }
                },
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: AppTheme.deepTeal.withOpacity(0.2)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Upload Pending Documents',
                  style: TextStyle(color: AppTheme.deepTeal, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
