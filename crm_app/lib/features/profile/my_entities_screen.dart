// ignore_for_file: deprecated_member_use, unused_local_variable, unused_import, unused_element_parameter
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../models/user_model.dart';
import '../../models/order_model.dart';
import '../../providers/compliance_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import '../services/registration_services_screen.dart';
import '../../core/constants/port.dart';
import '../../core/utils/error_handler.dart';
import 'package:dropdown_button2/dropdown_button2.dart';

/// Holds names of entities submitted by the user but not yet approved.
/// Cleared when the full entity list is refreshed from the server.
final pendingEntitiesProvider = StateProvider<List<String>>((ref) => []);

class MyEntitiesScreen extends ConsumerWidget {
  const MyEntitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProfileProvider);
    final ordersAsync = ref.watch(serviceOrdersProvider);
    final orders = ordersAsync.value ?? [];

    final isLoading =
        userAsync.isLoading || (ordersAsync.isLoading && orders.isEmpty);

    // ── Real entities from the profile API (client_entities[]) ────────────
    final List<ClientEntity> clientEntities = List.from(userAsync.value?.clientEntities ?? []);

    // Create a map to ensure uniqueness by entityName
    final Map<String, ClientEntity> mergedEntities = {};
    for (final ce in clientEntities) {
      if (ce.entityName.trim().isNotEmpty) {
        mergedEntities[ce.entityName.trim().toLowerCase()] = ce;
      }
    }

    // Fallback: If the user's primary companyName isn't in the list, add it automatically
    final primaryCompanyName = userAsync.value?.companyName.trim() ?? '';
    if (primaryCompanyName.isNotEmpty && !mergedEntities.containsKey(primaryCompanyName.toLowerCase())) {
      mergedEntities[primaryCompanyName.toLowerCase()] = ClientEntity(
        entityName: primaryCompanyName,
        entityType: 'Company',
        cin: '', pan: '', tan: '', gstin: '', 
        iso: '', msme: '', fssai: '', coi: '', dsc: '',
        trademarkApplicationNumber: '', trademarkStatus: '', trademarkCertificate: '',
        patentApplicationNumber: '', patentStatus: '', patentNumber: '',
        copyrightRegistrationNumber: '', copyrightCertificate: '',
      );
    }

    // Add entities found in orders that aren't in clientEntities yet
    for (final o in orders) {
      final name = o.entityName.trim().isNotEmpty && o.entityName.trim() != 'Default'
          ? o.entityName.trim()
          : o.companyName.trim();
      if (name.isNotEmpty && !mergedEntities.containsKey(name.toLowerCase())) {
        mergedEntities[name.toLowerCase()] = ClientEntity(
          entityName: name,
          entityType: 'Company', // fallback
          cin: '', pan: '', tan: '', gstin: '', iso: '', msme: '', fssai: '', coi: '', dsc: '',
          trademarkApplicationNumber: '', trademarkStatus: '', trademarkCertificate: '',
          patentApplicationNumber: '', patentStatus: '', patentNumber: '',
          copyrightRegistrationNumber: '', copyrightCertificate: '',
        );
      }
    }
    
    final finalEntities = mergedEntities.values.toList();

    // Enrich with active service count from checklists
    final entityCards = finalEntities.map((e) {
      final entityName = e.entityName.trim();
      final activeCount = orders
          .where((o) =>
              o.status == ServiceStatus.active &&
              (o.entityName.trim().toLowerCase() ==
                      entityName.toLowerCase() ||
                  o.companyName.trim().toLowerCase() ==
                      entityName.toLowerCase()))
          .length;
      return _EntityCardData(
        entity: e,
        serviceCount: activeCount,
      );
    }).toList();

    // Build the "All Entities" summary card
    final totalActive =
        orders.where((o) => o.status == ServiceStatus.active).length;

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
          'Switch Entities',
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.deepTeal),
              ),
            )
          : entityCards.isEmpty
              ? const _EntitiesEmptyState()
              : _EntityList(entityCards: entityCards),
      floatingActionButton: entityCards.isNotEmpty
          ? FloatingActionButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => const _AddEntityBottomSheet(),
                );
              },
              backgroundColor: AppTheme.deepTeal,
              shape: const CircleBorder(),
              child: const HugeIcon(icon: HugeIcons.strokeRoundedAddCircle, color: Colors.white, size: 24),
            )
          : null,
    );
  }
}

// ── Add Entity Bottom Sheet ──────────────────────────────────────────────────

class _AddEntityBottomSheet extends ConsumerStatefulWidget {
  const _AddEntityBottomSheet();

  @override
  ConsumerState<_AddEntityBottomSheet> createState() => _AddEntityBottomSheetState();
}

class _AddEntityBottomSheetState extends ConsumerState<_AddEntityBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _typeController = TextEditingController();
  final ValueNotifier<String?> _typeNotifier = ValueNotifier<String?>(null);
  final _directorController = TextEditingController();
  final _stateController = TextEditingController();
  final ValueNotifier<String?> _stateNotifier = ValueNotifier<String?>(null);
  final TextEditingController _stateSearchController = TextEditingController();
  
  bool _isLoading = false;

  final List<String> _companyTypes = [
    'Private Limited',
    'LLP',
    'One Person Company',
    'Proprietorship',
    'Others',
  ];

  final List<String> _indianStates = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _typeController.dispose();
    _directorController.dispose();
    _stateController.dispose();
    _stateSearchController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);

    try {
      final authRepo = ref.read(authRepositoryProvider);
      await authRepo.addEntity(
        companyName: _nameController.text.trim(),
        companyType: _typeController.text.trim(),
        directorCount: _directorController.text.trim(),
        stateOfRegistration: _stateController.text.trim(),
      );
      
      if (!mounted) return;
      
      final submittedName = _nameController.text.trim();
      
      // Add to local pending list so the UI shows 'Waiting for Approval'
      ref.read(pendingEntitiesProvider.notifier).update((list) => [...list, submittedName]);
      
      Navigator.pop(context);
      
      globalScaffoldMessengerKey.currentState?.showSnackBar(
        SnackBar(
          content: Text('Your request to add "$submittedName" has been sent.'),
          backgroundColor: AppTheme.deepTeal,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Add New Entity',
                  style: GoogleFonts.outfit(
                    color: AppTheme.deepTeal,
                    fontWeight: FontWeight.w600,
                    fontSize: 18,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x, color: Colors.black54),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Submit a request to add a secondary company to your profile.',
              style: GoogleFonts.poppins(
                color: Colors.black54,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameController,
              autofocus: true,
              style: GoogleFonts.poppins(color: Colors.black87, fontSize: 13),
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                labelText: 'Entity Name',
                labelStyle: GoogleFonts.poppins(color: Colors.black54, fontSize: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (v.trim().length < 3) return 'Name too short';
                return null;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField2<String>(
              isExpanded: true,
              valueListenable: _typeNotifier,
              decoration: InputDecoration(
                labelText: 'Type of Company',
                labelStyle: GoogleFonts.poppins(color: Colors.black54, fontSize: 12),
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
              hint: Text('Select Company Type', style: GoogleFonts.poppins(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.normal)),
              buttonStyleData: const FormFieldButtonStyleData(padding: EdgeInsets.zero),
items: _companyTypes.map((item) => DropdownItem<String>(
                value: item,
                child: Text(item, style: GoogleFonts.poppins(fontSize: 13)),
              )).toList(),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Please select company type';
                return null;
              },
              onChanged: (value) {
                if (value != null) {
                  _typeController.text = value;
                  _typeNotifier.value = value;
                }
              },
              iconStyleData: const IconStyleData(
                icon: Icon(LucideIcons.chevronDown, color: Colors.black54),
              ),
              dropdownStyleData: DropdownStyleData(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _directorController,
              keyboardType: TextInputType.number,
              style: GoogleFonts.poppins(color: Colors.black87, fontSize: 13),
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                labelText: 'Number of Directors',
                hintText: 'e.g. 2',
                hintStyle: GoogleFonts.poppins(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.normal),
                labelStyle: GoogleFonts.poppins(color: Colors.black54, fontSize: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField2<String>(
              isExpanded: true,
              valueListenable: _stateNotifier,
              decoration: InputDecoration(
                labelText: 'State of Registration',
                labelStyle: GoogleFonts.poppins(color: Colors.black54, fontSize: 12),
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
              hint: Text('Select State / UT', style: GoogleFonts.poppins(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.normal)),
              buttonStyleData: const FormFieldButtonStyleData(padding: EdgeInsets.zero),
items: _indianStates.map((item) => DropdownItem<String>(
                value: item,
                child: Text(item, style: GoogleFonts.poppins(fontSize: 13)),
              )).toList(),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Please select state of registration';
                return null;
              },
              onChanged: (value) {
                if (value != null) {
                  _stateController.text = value;
                  _stateNotifier.value = value;
                }
              },
              iconStyleData: const IconStyleData(
                icon: Icon(LucideIcons.chevronDown, color: Colors.black54),
              ),
              dropdownStyleData: DropdownStyleData(
                maxHeight: 300,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              dropdownSearchData: DropdownSearchData(
                searchController: _stateSearchController,
                searchBarWidgetHeight: 50,
                searchBarWidget: Container(
                  height: 50,
                  padding: const EdgeInsets.only(
                    top: 8,
                    bottom: 4,
                    right: 8,
                    left: 8,
                  ),
                  child: TextFormField(
                    expands: true,
                    maxLines: null,
                    controller: _stateSearchController,
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      hintText: 'Search for a state...',
                      hintStyle: GoogleFonts.poppins(fontSize: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                searchMatchFn: (item, searchValue) {
                  return item.value.toString().toLowerCase().contains(searchValue.toLowerCase());
                },
              ),
              onMenuStateChange: (isOpen) {
                if (!isOpen) {
                  _stateSearchController.clear();
                }
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _submitRequest,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.deepTeal,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      'Submit Request',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}

// ── Data holder ──────────────────────────────────────────────────────────────
class _EntityCardData {
  final ClientEntity entity;
  final int serviceCount;
  final bool isPending;

  const _EntityCardData({
    required this.entity,
    required this.serviceCount,
    this.isPending = false,
  });
}

// ── Entity list with pending support ─────────────────────────────────────────
class _EntityList extends ConsumerWidget {
  final List<_EntityCardData> entityCards;
  const _EntityList({required this.entityCards});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingNames = ref.watch(pendingEntitiesProvider);

    // Filter out pending names that are now approved (exist in entityCards)
    final approvedNames = entityCards.map((c) => c.entity.entityName.trim().toLowerCase()).toSet();
    final stillPending = pendingNames.where((n) => !approvedNames.contains(n.toLowerCase())).toList();

    // Build pending placeholder cards
    final pendingCards = stillPending.map((name) => _EntityCardData(
      entity: ClientEntity(
        entityName: name,
        entityType: 'Pending',
        cin: '', pan: '', tan: '', gstin: '', iso: '', msme: '',
        fssai: '', coi: '', dsc: '',
        trademarkApplicationNumber: '', trademarkStatus: '', trademarkCertificate: '',
        patentApplicationNumber: '', patentStatus: '', patentNumber: '',
        copyrightRegistrationNumber: '', copyrightCertificate: '',
      ),
      serviceCount: 0,
      isPending: true,
    )).toList();

    final allCards = [...entityCards, ...pendingCards];

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        ...allCards.map((c) => _EntityCard(data: c)),
      ],
    );
  }
}

final List<IconData> _entityIcons = [
  LucideIcons.building2,
  LucideIcons.briefcase,
  LucideIcons.landmark,
  LucideIcons.store,
  LucideIcons.boxes,
  LucideIcons.gem,
  LucideIcons.factory,
  LucideIcons.album,
  LucideIcons.cpu,
  LucideIcons.network,
];

IconData _iconForEntity(String name) {
  final hash = name.trim().toLowerCase().codeUnits.fold<int>(0, (p, e) => p + e);
  return _entityIcons[hash % _entityIcons.length];
}


// ── Individual entity card ─────────────────────────────────────────────────

class _EntityCard extends ConsumerWidget {
  final _EntityCardData data;

  const _EntityCard({required this.data}); // ignore: unused_element

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entity = data.entity;
    final entityName = entity.entityName.trim();
    final entityType = entity.entityType.isNotEmpty ? entity.entityType : 'Company';
    final icon = _iconForEntity(entityName);

    // Selected state uses entityName (canonical key)
    final selectedEntity = ref.watch(selectedEntityProvider);
    final isSelected = selectedEntity == entityName;

    return InkWell(
      onTap: () {
        if (data.isPending) {
          globalScaffoldMessengerKey.currentState?.showSnackBar(
            SnackBar(
              content: const Text('This entity is waiting for manager approval.'),
              backgroundColor: Colors.black87,
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
          return;
        }

        // Grab navigator before updating state
        final nav = Navigator.of(context);
        
        // Store entityName as the canonical selector key
        ref.read(selectedEntityProvider.notifier).state = entityName;
        
        nav.pop();
        
        // Use global messenger to bypass context-based build errors entirely
        Future.delayed(const Duration(milliseconds: 200), () {
          globalScaffoldMessengerKey.currentState?.showSnackBar(
            SnackBar(
              content: Text('Switched to $entityName'),
              backgroundColor: AppTheme.deepTeal,
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppTheme.deepTeal.withOpacity(0.1)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isSelected ? 24 : 16,
              spreadRadius: 0,
              offset: Offset(0, isSelected ? 12 : 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.deepTeal.withOpacity(0.1),
              ),
              child: entity.entityLogo.isNotEmpty
                  ? ClipOval(
                      child: Image.network(
                        '$kBaseUrl/${entity.entityLogo}',
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Icon(icon, color: AppTheme.deepTeal, size: 24),
                      ),
                    )
                  : Text(
                      entityName.isNotEmpty ? entityName[0].toUpperCase() : 'C',
                      style: const TextStyle(
                        color: AppTheme.deepTeal,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entityName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (data.isPending)
                    Row(
                      children: [
                        const Icon(LucideIcons.clock, size: 12, color: Colors.orange),
                        const SizedBox(width: 4),
                        Text(
                          'Waiting for Approval',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.orange.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    )
                  else
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.deepTeal.withOpacity(0.3)),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            entityType,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.deepTeal,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${data.serviceCount} Active Services',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade500,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.deepTeal.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.check, color: AppTheme.deepTeal, size: 20),
              )
            else
              Icon(LucideIcons.chevronRight, color: Colors.grey.shade300),
          ],
        ),
      ),
    );
  }
}


// ── Empty State ────────────────────────────────────────────────────────────

class _EntitiesEmptyState extends StatelessWidget {
  const _EntitiesEmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppTheme.deepTeal.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              LucideIcons.building2,
              size: 80,
              color: AppTheme.deepTeal.withOpacity(0.2),
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'No Registered Entities',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'You haven\'t registered any companies yet. Start your registration process today.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey.shade500,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const RegistrationServicesScreen(),
                ),
              ),
              icon: const Icon(LucideIcons.rocket, size: 18),
              label: const Text('Start Registration'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.deepTeal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
