import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/theme/app_theme.dart';
import '../../core/constants/port.dart';
import '../../providers/auth_provider.dart';
import '../../core/utils/responsive.dart';

class SupportTicketsScreen extends ConsumerStatefulWidget {
  const SupportTicketsScreen({super.key});

  @override
  ConsumerState<SupportTicketsScreen> createState() =>
      _SupportTicketsScreenState();
}

class _SupportTicketsScreenState extends ConsumerState<SupportTicketsScreen> {
  List<dynamic> _tickets = [];
  List<dynamic> _completedServices = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Schedule fetch after first frame when context is available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchTickets();
    });
  }

  Future<void> _fetchTickets() async {
    final user = ref.read(userProfileProvider).value;
    if (user == null) {
      setState(() {
        _isLoading = false;
        _errorMessage = "User profile not loaded.";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await http
          .get(
            Uri.parse('$kBaseUrl/api/tickets/user/${user.id}'),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Fetch completed services
        final servicesResponse = await http.get(
          Uri.parse('$kBaseUrl/api/my-checklists'),
          headers: {'x-user-id': user.id},
        ).timeout(const Duration(seconds: 10));

        List<dynamic> completedServices = [];
        if (servicesResponse.statusCode == 200) {
          final servicesData = jsonDecode(servicesResponse.body);
          final checklists = servicesData['checklists'] as List<dynamic>? ?? [];
          completedServices = checklists.where((c) => c['status'] == 'completed').toList();
        }

        setState(() {
          _tickets = data['tickets'] ?? [];
          _completedServices = completedServices;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = "Failed to load tickets: ${response.statusCode}";
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Connection error. Please try again.";
        _isLoading = false;
      });
    }
  }

  Future<void> _createNewTicket(String subject, String description,
      String checklistId) async {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;

    try {
      final response = await http
          .post(
            Uri.parse('$kBaseUrl/api/checklists/$checklistId/support-ticket'),
            headers: {'Content-Type': 'application/json', 'x-user-id': user.id},
            body: jsonEncode({
              'userId': user.id,
              'userName': user.name,
              'userEmail': user.email,
              'subject': subject,
              'description': description,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ticket created successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
        _fetchTickets();
      } else {
        throw Exception("Server returned ${response.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to raise ticket: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showNewTicketDialog() {
    if (_completedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No completed services available to raise a ticket for.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final formKey = GlobalKey<FormState>();
    final subjectController = TextEditingController();
    final descriptionController = TextEditingController();
    String selectedCategory = _completedServices[0]['_id'] ?? '';
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.deepTeal.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      LucideIcons.messageSquarePlus,
                      color: AppTheme.deepTeal,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Raise Support Ticket',
                          style: TextStyle(
                            color: AppTheme.deepTeal,
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                          ),
                        ),
                        Text(
                          'Fill out the details below',
                          style: TextStyle(
                            color: Colors.grey,
                            fontWeight: FontWeight.w400,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              content: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: selectedCategory,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                          color: AppTheme.deepTeal,
                        ),
                        onChanged: (val) {
                          if (val != null) {
                            setDialogState(() {
                              selectedCategory = val;
                            });
                          }
                        },
                        items: _completedServices.map((service) {
                          return DropdownMenuItem<String>(
                            value: service['_id'],
                            child: Text(
                              service['service_name'] ?? 'Service',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          );
                        }).toList(),
                        decoration: InputDecoration(
                          labelText: 'Select Completed Service',
                          prefixIcon: const Icon(LucideIcons.grid,
                              size: 20, color: AppTheme.deepTeal),
                          filled: true,
                          fillColor: Colors.grey[50],
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide:
                                BorderSide(color: Colors.grey.withOpacity(0.1)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: subjectController,
                        decoration: InputDecoration(
                          labelText: 'Subject',
                          hintText: 'e.g., GST Registration Failure',
                          prefixIcon: const Icon(LucideIcons.tag,
                              size: 17, color: AppTheme.deepTeal),
                          filled: true,
                          fillColor: Colors.grey[50],
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide:
                                BorderSide(color: Colors.grey.withOpacity(0.1)),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter a subject';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      // Priority level removed
                      TextFormField(
                        controller: descriptionController,
                        maxLines: 4,
                        decoration: InputDecoration(
                          labelText: 'Description',
                          hintText: 'Describe your issue in detail...',
                          prefixIcon: const Icon(LucideIcons.alignLeft,
                              size: 17, color: AppTheme.deepTeal),
                          filled: true,
                          fillColor: Colors.grey[50],
                          alignLabelWithHint: true,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide:
                                BorderSide(color: Colors.grey.withOpacity(0.1)),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter a description';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed:
                      isSubmitting ? null : () => Navigator.pop(dialogContext),
                  child: Text(
                    'Cancel',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          if (formKey.currentState!.validate()) {
                            setDialogState(() {
                              isSubmitting = true;
                            });
                            await _createNewTicket(
                              subjectController.text.trim(),
                              descriptionController.text.trim(),
                              selectedCategory,
                            );
                            if (dialogContext.mounted) {
                              Navigator.pop(dialogContext);
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.deepTeal,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(110, 48),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Submit',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    Responsive.init(context);

    // Split tickets into Active (Pending, In Progress) and History (Resolved)
    final activeTickets = _tickets
        .where((t) => t['status'] == 'Pending' || t['status'] == 'In Progress')
        .toList();
    final previousTickets =
        _tickets.where((t) => t['status'] == 'Resolved').toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Support Tickets',
          style: TextStyle(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw,
                color: AppTheme.deepTeal, size: 18),
            onPressed: _fetchTickets,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_errorMessage!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _fetchTickets,
                          style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.deepTeal),
                          child: const Text('Retry',
                              style: TextStyle(color: Colors.white)),
                        )
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchTickets,
                  child: ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      // Active Tickets Header & List
                      const Text(
                        'Active Tickets',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (activeTickets.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(
                            child: Text(
                              'No active tickets.',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        )
                      else
                        ...activeTickets.map((t) => _buildTicketCard(t)),

                      const SizedBox(height: 32),

                      // History Tickets Header & List
                      const Text(
                        'Previous Tickets',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (previousTickets.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(
                            child: Text(
                              'No previous resolved tickets.',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        )
                      else
                        ...previousTickets.map((t) => _buildHistoryTicket(t)),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewTicketDialog,
        backgroundColor: AppTheme.deepTeal,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text(
          'New Ticket',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildTicketCard(dynamic ticket) {
    final status = ticket['status'] ?? 'Pending';
    final expert = ticket['expert'] ?? 'Unassigned';
    final ticketId = ticket['ticketId'] ?? 'INC-0000';
    final subject = ticket['subject'] ?? 'No Subject';
    final description = ticket['description'] ?? '';
    final category = ticket['category'] ?? 'General Support';
    final priority = ticket['priority'] ?? 'Low';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.premiumGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepTeal.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold),
                ),
              ),
              Text(
                'ID: $ticketId',
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            subject,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              // Category badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.white.withOpacity(0.12)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.grid,
                        size: 10, color: Colors.white70),
                    const SizedBox(width: 4),
                    Text(
                      category,
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                          fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              // Priority badge removed
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 24),
          const Divider(color: Colors.white24),
          const SizedBox(height: 16),
          Row(
            children: [
              const CircleAvatar(
                radius: 12,
                backgroundColor: Colors.white24,
                child: Icon(LucideIcons.user, size: 12, color: Colors.white),
              ),
              const SizedBox(width: 8),
              Text(
                'Expert: $expert',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTicket(dynamic ticket) {
    final ticketId = ticket['ticketId'] ?? 'INC-0000';
    final subject = ticket['subject'] ?? 'No Subject';
    final status = ticket['status'] ?? 'Resolved';
    final category = ticket['category'] ?? 'General Support';
    final priority = ticket['priority'] ?? 'Low';

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
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppTheme.deepTeal,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      ticketId,
                      style:
                          TextStyle(color: Colors.grey.shade500, fontSize: 11),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '•',
                      style:
                          TextStyle(color: Colors.grey.shade400, fontSize: 11),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        category,
                        style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 11,
                            fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status,
              style: const TextStyle(
                color: Colors.green,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
