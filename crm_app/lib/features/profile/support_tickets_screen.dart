import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/theme/app_theme.dart';
import '../../core/constants/port.dart';
import '../../providers/auth_provider.dart';
import '../../providers/compliance_provider.dart';
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

  /// Maps checklist _id → entity name so tickets can show their entity
  final Map<String, String> _checklistEntityMap = {};

  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchTickets();
    });
  }

  /// Resolve entity name for a ticket.
  /// Chain: ticket.checklistId (populated object) → details.entityName
  String _resolveEntityName(Map<String, dynamic> ticket) {
    // 1. If backend populated checklistId as an object
    final clObj = ticket['checklistId'];
    if (clObj is Map<String, dynamic>) {
      final details = clObj['details'];
      final name = (details is Map<String, dynamic>
              ? (details['entityName'] ??
                  details['companyName'] ??
                  details['proposed_company_name'] ??
                  details['businessName'] ??
                  details['entity_name'])
              : null) ??
          clObj['entityName'] ??
          clObj['companyName'];
      if (name != null && name.toString().trim().isNotEmpty) {
        return name.toString().trim();
      }
    }

    // 2. Fallback: look up in local map by string ID
    if (clObj is String && _checklistEntityMap.containsKey(clObj)) {
      return _checklistEntityMap[clObj]!;
    }

    // 3. Direct entity fields on ticket
    if (ticket['entityName'] != null) return ticket['entityName'].toString().trim();

    // 4. Last resort: category (service name — not ideal but better than nothing)
    return ticket['category']?.toString() ?? 'Support';
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
      // 1. Fetch checklists FIRST to build entity map & completed services
      //    (needed so entity names are ready when tickets render)
      final servicesResponse = await http.get(
        Uri.parse('$kBaseUrl/api/my-checklists'),
        headers: {'x-user-id': user.id},
      ).timeout(const Duration(seconds: 10));

      List<dynamic> completedServices = [];
      _checklistEntityMap.clear();

      if (servicesResponse.statusCode == 200) {
        final servicesData = jsonDecode(servicesResponse.body);
        final checklists =
            servicesData['checklists'] as List<dynamic>? ?? [];

        for (final c in checklists) {
          final cMap = c as Map<String, dynamic>;
          final id = cMap['_id']?.toString() ?? '';

          // Resolve entity name: details fields take priority
          final details = cMap['details'];
          final entityName = (details is Map<String, dynamic>
                  ? (details['entityName'] ??
                      details['companyName'] ??
                      details['proposed_company_name'] ??
                      details['businessName'] ??
                      details['entity_name'])
                  : null) ??
              cMap['entityName'] ??
              cMap['companyName'] ??
              '';

          if (id.isNotEmpty && entityName.toString().trim().isNotEmpty) {
            _checklistEntityMap[id] = entityName.toString().trim();
          }

          // Include completed services (backend now preserves 'completed' status)
          if (cMap['status'] == 'completed') {
            completedServices.add(c);
          }
        }
      }

      // 2. Fetch tickets (backend now populates checklistId with entity details)
      final response = await http
          .get(
            Uri.parse('$kBaseUrl/api/tickets/user/${user.id}'),
            headers: {'x-user-id': user.id},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final tickets = (data['tickets'] as List<dynamic>?) ?? [];
        setState(() {
          _tickets = tickets;
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

  Future<void> _createNewTicket(
      String subject, String description, String checklistId) async {
    final user = ref.read(userProfileProvider).value;
    if (user == null) return;

    try {
      final response = await http
          .post(
            Uri.parse('$kBaseUrl/api/checklists/$checklistId/support-ticket'),
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id,
            },
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
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? "Server returned ${response.statusCode}");
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
    final selectedEntity = ref.read(selectedEntityProvider);
    final filteredCompletedServices = _completedServices.where((c) {
      if (selectedEntity == 'All Entities') return true;
      final cMap = c as Map<String, dynamic>;
      final entityName = _checklistEntityMap[cMap['_id']?.toString() ?? ''] ?? '';
      return entityName.toLowerCase() == selectedEntity.toLowerCase();
    }).toList();

    if (filteredCompletedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(selectedEntity == 'All Entities' 
            ? 'No completed services available to raise a ticket for.' 
            : 'No completed services available for $selectedEntity.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final formKey = GlobalKey<FormState>();
    final subjectController = TextEditingController();
    final descriptionController = TextEditingController();
    String selectedCategory = filteredCompletedServices[0]['_id'] ?? '';
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
                      color: AppTheme.deepTeal.withValues(alpha: 0.08),
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
                        items: filteredCompletedServices.map((service) {
                          final sMap = service as Map<String, dynamic>;
                          // Show "EntityName – ServiceName" in dropdown
                          final entityName =
                              _checklistEntityMap[sMap['_id']?.toString() ?? ''] ?? '';
                          final serviceName = sMap['service_name'] ?? 'Service';
                          final label = entityName.isNotEmpty
                              ? '$entityName – $serviceName'
                              : serviceName;
                          return DropdownMenuItem<String>(
                            value: sMap['_id'],
                            child: Text(
                              label,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w400,
                              ),
                              overflow: TextOverflow.ellipsis,
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
                                BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
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
                                BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
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
                                BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
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

    final selectedEntity = ref.watch(selectedEntityProvider);

    final filteredTickets = _tickets.where((t) {
      if (selectedEntity == 'All Entities') return true;
      final entityName = _resolveEntityName(t as Map<String, dynamic>);
      return entityName.toLowerCase() == selectedEntity.toLowerCase();
    }).toList();

    final activeTickets = filteredTickets
        .where((t) => t['status'] == 'Pending' || t['status'] == 'In Progress')
        .toList();
    final previousTickets =
        filteredTickets.where((t) => t['status'] == 'Resolved').toList();

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
                      // Active Tickets
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

                      // Previous Tickets
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
    final t = ticket as Map<String, dynamic>;
    final status = t['status'] ?? 'Pending';
    final expert = t['expert'] ?? 'Unassigned';
    final ticketId = t['ticketId'] ?? 'INC-0000';
    final subject = t['subject'] ?? 'No Subject';
    final description = t['description'] ?? '';
    final entityName = _resolveEntityName(t);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppTheme.premiumGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepTeal.withValues(alpha: 0.3),
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
                  color: Colors.white.withValues(alpha: 0.2),
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
          if (entityName.isNotEmpty) ...[
            const SizedBox(height: 8),
            // Entity badge
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.building2,
                      size: 10, color: Colors.white70),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      entityName,
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                          fontWeight: FontWeight.w600),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
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
    final t = ticket as Map<String, dynamic>;
    final ticketId = t['ticketId'] ?? 'INC-0000';
    final subject = t['subject'] ?? 'No Subject';
    final status = t['status'] ?? 'Resolved';
    final entityName = _resolveEntityName(t);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
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
                    if (entityName.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Text('•',
                          style: TextStyle(
                              color: Colors.grey.shade400, fontSize: 11)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          entityName,
                          style: TextStyle(
                              color: Colors.grey.shade600,
                              fontSize: 11,
                              fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
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
