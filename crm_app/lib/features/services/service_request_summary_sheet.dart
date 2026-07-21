import 'package:crm_app/core/utils/error_handler.dart';
import 'package:crm_app/core/utils/file_picker_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:crm_app/core/utils/validation_utils.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/pan_provider.dart';
import '../../core/constants/service_documents.dart';
import '../../providers/auth_provider.dart';
import '../../providers/orders_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import 'dart:convert';
import '../../core/constants/port.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:open_filex/open_filex.dart';

class ServiceRequestSummarySheet extends ConsumerStatefulWidget {
  final String packageName;
  /// If provided, the entity dropdown will be pre-selected to this entity.
  /// Use this when opening the sheet for a renewal so the request goes to
  /// the same entity as the original (completed) service.
  final String? preselectedEntity;

  const ServiceRequestSummarySheet({
    super.key,
    required this.packageName,
    this.preselectedEntity,
  });

  @override
  ConsumerState<ServiceRequestSummarySheet> createState() =>
      _ServiceRequestSummarySheetState();
}

class _ServiceRequestSummarySheetState
    extends ConsumerState<ServiceRequestSummarySheet> {
  late TextEditingController _phoneController;
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _gstPanController;

  // Private Limited Incorporation Specific Controllers
  late TextEditingController _numberOfDirectorsController;
  late TextEditingController _incorporationDetailsController;
  late TextEditingController _companyNameController;
  late TextEditingController _businessActivityController;
  late TextEditingController _ownerNameController;
  late TextEditingController _companyEmailController;
  late TextEditingController _companyPhoneController;
  late TextEditingController _paidUpCapitalController;
  late TextEditingController _valuePerShareController;
  late TextEditingController _noOfSharesController;

  // Trademark Specific Controllers
  late TextEditingController _udyamNumberController;
  late TextEditingController _tmApplicantNameController;
  late TextEditingController _tmAddressController;
  late TextEditingController _partnersNameController;
  late TextEditingController _businessDescController;
  late TextEditingController _tmTradeDescriptionController;
  late TextEditingController _brandUsageDateController;

  bool _isBrandUsed = false;
  String _selectedEducation = '';
  String _annualTurnover = 'Less than ₹20 Lakhs';

  String? _selectedEntity;
  late TextEditingController _customEntityController;

  late TextEditingController _fssaiEmployeesController;
  late TextEditingController _fssaiPremisesAddressController;
  late TextEditingController _fssaiVillageController;
  late TextEditingController _fssaiDistrictController;
  late TextEditingController _fssaiCorrAddressController;
  late TextEditingController _fssaiCorrVillageController;
  late TextEditingController _fssaiCorrDistrictController;
  late TextEditingController _fssaiStartDateController;

  // MSME Specific Controllers
  late TextEditingController _msmeUnitsController;
  late TextEditingController _msmeMaleEmployeesController;
  late TextEditingController _msmeFemaleEmployeesController;
  late TextEditingController _msmeIncDateController;
  late TextEditingController _msmeCommenceDateController;
  late TextEditingController _msmePrevUdyamController;
  late TextEditingController _msmeGstNumberController;
  late TextEditingController _msmeInvestmentController;
  late TextEditingController _msmeTurnoverController;

  // DUNS Specific Controllers
  late TextEditingController _dunsTradeNameController;
  late TextEditingController _dunsYearController;

  String _officePreference = 'Own Address';
  final String _msmeType = 'Micro';
  final String _tradeNature = 'Goods';
  final String _markType = 'Word mark';
  final bool _tmVerification = false;

  // FSSAI State
  String _fssaiBusinessType = 'Proprietorship';
  String _fssaiTurnover = 'Below ₹12 Lakhs';
  String _fssaiPremisesType = 'Own';
  bool _isCorrespondenceSame = true;
  bool _fssaiDeclaration = false;
  final List<String> _selectedFssaiNatures = [];

  final List<String> _fssaiNatureOptions = [
    'Manufacturer',
    'Trader',
    'Retailer',
    'Distributor',
    'Wholesaler',
    'Restaurant / Food Service',
    'Caterer',
    'Importer',
    'Exporter',
    'Storage / Warehouse',
    'Transporter',
    'E-commerce Food Seller',
    'Other'
  ];

  // MSME State
  String _msmeOrgSelection = 'Proprietorship';
  String _msmeActivity = 'Services';

  // DUNS State
  String _dunsBusinessType = 'Private Limited';

  bool _isPhoneValid = false;
  bool _isCompanyPhoneValid = false;
  String _consent = 'Agree';

  // Compliance Turnover Option
  String? _selectedTurnover;
  final List<String> _turnoverOptions = [
    'Below ₹20 Lakhs',
    '₹20 Lakhs - ₹50 Lakhs',
    'Above ₹50 Lakhs'
  ];
  bool _showTurnoverError = false;

  final _formKey = GlobalKey<FormState>();
  int _currentPage = 0;
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();

  // Map to store files per document slot
  // Key is the document name from kServiceRequiredDocuments or 'Other Documents'
  final Map<String, List<PlatformFile>> _documentSlots = {};

  // Helper to get all slots (required + general)
  List<String> get _allSlots {
    if (!_isTwoStepForm) return [];
    final docs = kServiceRequiredDocuments[widget.packageName] ?? [];
    return [...docs, 'Other Documents'];
  }

  bool get _isTwoStepForm {
    return false;
  }

  // Define required documents based on service
  List<String> get _requiredDocs {
    final docs = kServiceRequiredDocuments[widget.packageName]?.toList() ?? [];
    if (_officePreference == 'Virtual Office') {
      docs.removeWhere((doc) => doc.contains('Registered Office Proof'));
    }
    return docs;
  }

  bool get _areAllRequiredDocsUploaded {
    for (final doc in _requiredDocs) {
      if (!_documentSlots.containsKey(doc) ||
          (_documentSlots[doc]?.isEmpty ?? true)) {
        return false;
      }
    }
    return true;
  }

  String? _validateCompanyName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'This field is required';
    }
    final lowerValue = value.toLowerCase();
    
    if (widget.packageName == 'Private Limited Incorporation') {
      if (lowerValue.contains('llp') ||
          lowerValue.contains('opc') ||
          lowerValue.contains('one person company')) {
        return 'You are applying for Private Limited. Do not use LLP or OPC in the name.';
      }
    } else if (widget.packageName == 'LLP Incorporation') {
      if (lowerValue.contains('private limited') ||
          lowerValue.contains('pvt ltd') ||
          lowerValue.contains('pvt. ltd.') ||
          lowerValue.contains('opc') ||
          lowerValue.contains('one person company')) {
        return 'You are applying for LLP. Enter company name as [Name] LLP.';
      }
    } else if (widget.packageName.contains('OPC') ||
               widget.packageName.contains('One Person Company')) {
      if (lowerValue.contains('private limited') ||
          lowerValue.contains('pvt ltd') ||
          lowerValue.contains('pvt. ltd.') ||
          lowerValue.contains('llp')) {
        return 'You are applying for OPC. Do not use Private Limited or LLP.';
      }
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    // Pre-select entity if provided (e.g., for renewal flow)
    if (widget.preselectedEntity != null && widget.preselectedEntity!.isNotEmpty) {
      _selectedEntity = widget.preselectedEntity;
    }
    // Initialize with current profile info if available
    final userProfile = ref.read(userProfileProvider).value;
    String initialPhone = userProfile?.phone ?? '';
    if (initialPhone.startsWith('+91')) {
      initialPhone = initialPhone.replaceFirst('+91', '').trim();
    }
    _phoneController = TextEditingController(text: initialPhone);
    _nameController = TextEditingController(text: userProfile?.name ?? '');
    _emailController = TextEditingController(text: userProfile?.email ?? '');
    _gstPanController = TextEditingController();

    // Initialize Incorporation Controllers
    _numberOfDirectorsController = TextEditingController();
    _incorporationDetailsController = TextEditingController();
    _companyNameController = TextEditingController();
    _businessActivityController = TextEditingController();
    _ownerNameController = TextEditingController();
    _companyEmailController = TextEditingController();
    _companyPhoneController = TextEditingController();
    _paidUpCapitalController = TextEditingController();
    _valuePerShareController = TextEditingController();
    _noOfSharesController = TextEditingController();

    // Initialize Trademark Controllers
    _udyamNumberController = TextEditingController();
    _tmApplicantNameController = TextEditingController();
    _tmAddressController = TextEditingController();
    _partnersNameController = TextEditingController();
    _businessDescController = TextEditingController();
    _brandUsageDateController = TextEditingController();
    _tmTradeDescriptionController = TextEditingController();

    // Initialize FSSAI Controllers
    _fssaiEmployeesController = TextEditingController();
    _fssaiPremisesAddressController = TextEditingController();
    _fssaiVillageController = TextEditingController();
    _fssaiDistrictController = TextEditingController();
    _fssaiCorrAddressController = TextEditingController();
    _fssaiCorrVillageController = TextEditingController();
    _fssaiCorrDistrictController = TextEditingController();
    _fssaiStartDateController = TextEditingController();

    // Initialize MSME Controllers
    _msmeUnitsController = TextEditingController();
    _msmeMaleEmployeesController = TextEditingController();
    _msmeFemaleEmployeesController = TextEditingController();
    _msmeIncDateController = TextEditingController();
    _msmeCommenceDateController = TextEditingController();
    _msmePrevUdyamController = TextEditingController();
    _msmeGstNumberController = TextEditingController();
    _msmeInvestmentController = TextEditingController();
    _msmeTurnoverController = TextEditingController();

    // Initialize DUNS Controllers
    _dunsTradeNameController = TextEditingController();
    _dunsYearController = TextEditingController();
    _customEntityController = TextEditingController();

    _validatePhone(_phoneController.text);
    _validateCompanyPhone(_companyPhoneController.text);

    _phoneController.addListener(() {
      _validatePhone(_phoneController.text);
    });

    _companyPhoneController.addListener(() {
      _validateCompanyPhone(_companyPhoneController.text);
    });
  }

  void _validatePhone(String value) {
    setState(() {
      _isPhoneValid = value.length == 10 && RegExp(r'^[0-9]+$').hasMatch(value);
    });
  }

  void _validateCompanyPhone(String value) {
    setState(() {
      _isCompanyPhoneValid =
          value.length == 10 && RegExp(r'^[0-9]+$').hasMatch(value);
    });
  }

  Future<void> _pickFiles(String slotName) async {
    try {
      final result = await FilePickerUtil.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
        allowMultiple: true,
      );

      if (result != null) {
        final List<PlatformFile> validFiles = [];
        final List<String> tooLargeFiles = [];

        for (var file in result.files) {
          // 2MB limit check
          if (file.size <= 2 * 1024 * 1024) {
            validFiles.add(file);
          } else {
            tooLargeFiles.add(file.name);
          }
        }

        if (tooLargeFiles.isNotEmpty && mounted) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20)),
              title: const Row(
                children: [
                  Icon(LucideIcons.alertTriangle, color: Colors.redAccent),
                  SizedBox(width: 10),
                  Text('File Too Large',
                      style: TextStyle(
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal)),
                ],
              ),
              content: const Text(
                'Warning: File is large. Max 2MB allowed',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.corporateBlue)),
                ),
              ],
            ),
          );
        }

        setState(() {
          final currentFiles = _documentSlots[slotName] ?? [];
          _documentSlots[slotName] = [...currentFiles, ...validFiles];
        });
      }
    } catch (e) {
      showGlobalError(e);
      debugPrint('Error picking files for $slotName: $e');
    }
  }

  void _removeFile(String slotName, int index) {
    setState(() {
      _documentSlots[slotName]?.removeAt(index);
      if (_documentSlots[slotName]?.isEmpty ?? false) {
        _documentSlots.remove(slotName);
      }
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _gstPanController.dispose();
    _numberOfDirectorsController.dispose();
    _incorporationDetailsController.dispose();
    _companyNameController.dispose();
    _businessActivityController.dispose();
    _ownerNameController.dispose();
    _companyEmailController.dispose();
    _companyPhoneController.dispose();
    _paidUpCapitalController.dispose();
    _valuePerShareController.dispose();
    _noOfSharesController.dispose();
    _udyamNumberController.dispose();
    _tmApplicantNameController.dispose();
    _tmAddressController.dispose();
    _partnersNameController.dispose();
    _businessDescController.dispose();
    _brandUsageDateController.dispose();
    _tmTradeDescriptionController.dispose();

    _fssaiEmployeesController.dispose();
    _fssaiPremisesAddressController.dispose();
    _fssaiVillageController.dispose();
    _fssaiDistrictController.dispose();
    _fssaiCorrAddressController.dispose();
    _fssaiCorrVillageController.dispose();
    _fssaiCorrDistrictController.dispose();
    _fssaiStartDateController.dispose();

    _msmeUnitsController.dispose();
    _msmeMaleEmployeesController.dispose();
    _msmeFemaleEmployeesController.dispose();
    _msmeIncDateController.dispose();
    _msmeCommenceDateController.dispose();
    _msmePrevUdyamController.dispose();
    _msmeGstNumberController.dispose();
    _msmeInvestmentController.dispose();
    _msmeTurnoverController.dispose();

    _dunsTradeNameController.dispose();
    _dunsYearController.dispose();
    _customEntityController.dispose();
    _scrollController.dispose();

    super.dispose();
  }

  Future<bool> _submitServiceRequest() async {
    final userProfile = ref.read(userProfileProvider).value;
    if (userProfile == null) return false;

    try {
      final uri = Uri.parse(
          '$kBaseUrl/api/users/profile/${userProfile.id}/subscribe-service');
      final request = http.MultipartRequest('POST', uri);

      // Add serviceName field
      request.fields['serviceName'] = widget.packageName;

      // Add user profile details from forms
      request.fields['owner_name'] = _nameController.text;
      request.fields['email'] = _emailController.text;
      request.fields['phone'] = _phoneController.text;
      if (_companyNameController.text.isNotEmpty) {
        if (widget.packageName.contains('Incorporation')) {
          request.fields['company_name'] = _companyNameController.text;
        } else if (widget.packageName == 'MSME Certification') {
          request.fields['entity_name'] = _companyNameController.text;
        }
      }

      // Always populate entity_name properly from custom entity if Add New Entity is selected
      // except if it is MSME Certification where entity_name is already populated from companyNameController
      if (widget.packageName != 'MSME Certification') {
        String finalEntity = _selectedEntity == 'Add New Entity...' 
            ? _customEntityController.text 
            : (_selectedEntity ?? '');
        
        if (finalEntity.isNotEmpty) {
          request.fields['entity_name'] = finalEntity;
        }
      }

      // Collect package-specific details
      final Map<String, String> details = {};
      
      // Add common application details for hovering in manager dashboard
      details['Applicant Name'] = _nameController.text;
      details['Applicant Email'] = _emailController.text;
      details['Applicant Phone'] = _phoneController.text;

      if (!_isTwoStepForm) {
        details['Status'] = 'Pending Client Form Submission';
        details['Next Step'] = 'Assign expert to unlock form for client';
        if (widget.packageName.contains('Incorporation') || widget.packageName == '360° Compliance') {
           details['numberOfDirectors'] = _numberOfDirectorsController.text;
        }
        if (widget.packageName.contains('MCA Compliance') || widget.packageName.contains('GST filing') || widget.packageName.contains('360° Compliance')) {
          if (_selectedTurnover != null) {
            details['turnoverCategory'] = _selectedTurnover!;
          }
        }
      } else if (widget.packageName == 'Trademark Registration') {
        details['brand_name'] = _companyNameController.text;
        details['tm_address'] = _tmAddressController.text;
        details['is_brand_used'] = _isBrandUsed ? 'Yes' : 'No';
        if (_isBrandUsed) {
          details['brand_usage_date'] = _brandUsageDateController.text;
        }
      } else if (widget.packageName == 'FSSAI Food License') {
        details['fssai_business_type'] = _fssaiBusinessType;
        details['fssai_turnover'] = _fssaiTurnover;
        details['fssai_premises_type'] = _fssaiPremisesType;
        details['fssai_nature_of_business'] = _selectedFssaiNatures.join(', ');
        details['fssai_start_date'] = _fssaiStartDateController.text;
        details['fssai_employees'] = _fssaiEmployeesController.text;
        details['fssai_premises_address'] =
            _fssaiPremisesAddressController.text;
        details['fssai_village'] = _fssaiVillageController.text;
        details['fssai_district'] = _fssaiDistrictController.text;
        details['is_correspondence_same'] =
            _isCorrespondenceSame ? 'true' : 'false';
        if (!_isCorrespondenceSame) {
          details['fssai_corr_address'] = _fssaiCorrAddressController.text;
          details['fssai_corr_village'] = _fssaiCorrVillageController.text;
          details['fssai_corr_district'] = _fssaiCorrDistrictController.text;
        }
      } else if (widget.packageName == 'DUNS Number Registration') {
        details['duns_trade_name'] = _dunsTradeNameController.text;
        details['duns_year'] = _dunsYearController.text;
        details['duns_employees'] = _fssaiEmployeesController.text;
      } else if (widget.packageName == 'GST filing' || widget.packageName == 'MCA Compliance') {
        details['annualTurnover'] = _annualTurnover;
      }

      if (details.isNotEmpty) {
        request.fields['details'] = jsonEncode(details);
      }

      // Add selected files from document slots
      for (var entry in _documentSlots.entries) {
        final slotName = entry.key;
        for (var file in entry.value) {
          if (file.path != null) {
            request.files.add(
              await http.MultipartFile.fromPath(
                slotName, // fieldname is the document type/slot name
                file.path!,
              ),
            );
          }
        }
      }

      final streamedResponse =
          await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint(
            'Successfully registered service and uploaded documents on backend: ${widget.packageName}');
        return true;
      } else {
        debugPrint('Failed to register service on backend: ${response.body}');
        return false;
      }
    } catch (e) {
      showGlobalError(e);
      debugPrint('Error registering service: $e');
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(serviceOrdersProvider);
    final userProfile = ref.watch(userProfileProvider).value;
    
    final List<String> availableEntities = ordersState.value
        ?.map((o) => o.entityName)
        .where((name) => name.isNotEmpty && name.toLowerCase() != 'client')
        .toSet()
        .toList() ?? [];

    if (userProfile?.companyName != null && userProfile!.companyName.isNotEmpty && !availableEntities.contains(userProfile.companyName)) {
      availableEntities.insert(0, userProfile.companyName);
    }
    
    availableEntities.add('Add New Entity...');

    // Only auto-select first entity if no entity is pre-selected yet
    if (_selectedEntity == null && availableEntities.isNotEmpty) {
      _selectedEntity = availableEntities.first;
    }
    // Ensure preselected entity is always in the list (even if not in orders yet)
    if (widget.preselectedEntity != null &&
        widget.preselectedEntity!.isNotEmpty &&
        !availableEntities.contains(widget.preselectedEntity)) {
      availableEntities.insert(0, widget.preselectedEntity!);
    }

    final Map<String, String> entityTypesMap = {};
    if (ordersState.value != null) {
      for (final order in ordersState.value!) {
        final name = order.entityName;
        if (name.isNotEmpty && name.toLowerCase() != 'client') {
          final sName = order.serviceType.toLowerCase();
          if (sName.contains('private limited incorporation')) {
            entityTypesMap[name] = 'Private Limited Company';
          } else if (sName.contains('llp incorporation')) {
            entityTypesMap[name] = 'LLP';
          } else if (sName.contains('proprietorship')) {
            entityTypesMap[name] = 'Proprietorship';
          } else if (sName.contains('opc')) {
            entityTypesMap[name] = 'OPC';
          }
        }
      }
    }

    for (final name in availableEntities) {
      if (!entityTypesMap.containsKey(name) && name != 'Add New Entity...') {
        final lower = name.toLowerCase();
        if (lower.endsWith('pvt ltd') || lower.endsWith('private limited')) {
          entityTypesMap[name] = 'Private Limited Company';
        } else if (lower.endsWith('llp')) {
          entityTypesMap[name] = 'LLP';
        } else {
          entityTypesMap[name] = 'Unknown';
        }
      }
    }

    Map<String, String>? getCompatibilityWarning() {
      if (_selectedEntity == null || _selectedEntity == 'Add New Entity...') return null;
      
      final reqService = widget.packageName;

      bool isDuplicate = ordersState.value?.any((o) =>
              o.serviceType == reqService &&
              o.entityName == _selectedEntity &&
              o.status != 'completed' && o.status != 'complete') ??
          false;

      if (isDuplicate) {
        return {
          'type': 'error',
          'header': 'Service Already Requested',
          'message': 'Service request already done wait for manager approval'
        };
      }

      final completedOrders = ordersState.value?.where((o) =>
              o.serviceType == reqService &&
              o.entityName == _selectedEntity &&
              (o.status == 'completed' || o.status == 'complete')) ?? [];

      if (completedOrders.isNotEmpty) {
        final reqServiceLower = reqService.toLowerCase();
        bool isRenewalService = reqServiceLower.contains('patent') ||
                                reqServiceLower.contains('trademark') ||
                                reqServiceLower.contains('bis') ||
                                reqServiceLower.contains('fssai');

        if (isRenewalService) {
           bool canRenew = false;
           for (final order in completedOrders) {
             for (final doc in order.finalDocuments) {
                if (doc.expiryDate != null) {
                   final daysLeft = doc.expiryDate!.difference(DateTime.now()).inDays;
                   if (daysLeft <= 10) {
                      canRenew = true;
                      break;
                   }
                }
             }
             if (canRenew) break;
           }

           if (canRenew) {
             return {
               'type': 'warning',
               'header': 'Renewal Available',
               'message': 'This service is expiring soon. You can submit a renewal request.'
             };
           } else {
             return {
               'type': 'error',
               'header': 'Service Already Completed',
               'message': 'The requested service is already completed for this entity. Renewal options will be available within 10 days of expiry.'
             };
           }
        } else {
           return {
             'type': 'error',
             'header': 'Service Already Completed',
             'message': 'The requested service is already completed for this entity.'
           };
        }
      }

      final entityType = entityTypesMap[_selectedEntity] ?? 'Unknown';
      
      bool isIncorporationService = reqService.contains('Incorporation') || reqService.contains('Proprietorship') || reqService == 'OPC';

      if (isIncorporationService && _selectedEntity != 'Add New Entity...') {
          bool isTrulyIncorporated = false;
          
          // Check if the entity has a CIN (Corporate Identification Number), which proves it's already incorporated.
          if (userProfile != null) {
            try {
              final entity = userProfile.clientEntities.firstWhere((e) => e.entityName == _selectedEntity);
              if (entity.cin.trim().isNotEmpty || entity.coi.trim().isNotEmpty) {
                isTrulyIncorporated = true;
              }
            } catch (e) {
      showGlobalError(e);
              // Not found in client entities directly
            }
          }

          if (isTrulyIncorporated) {
            return {
              'type': 'error',
              'header': 'Already Incorporated',
              'message': 'This service is for registering a new entity. You have selected an entity that is already fully incorporated.\n\nPlease select "Add New Entity..." to provide the proposed company details.'
            };
          }

          final incorporationTypes = ['Private Limited Company', 'LLP', 'Proprietorship', 'OPC'];
          
          if (incorporationTypes.contains(entityType)) {
            return {
              'type': 'error',
              'header': 'Service Not Applicable',
              'message': 'This entity is already registered or has an active request as a $entityType.\n\nYou cannot apply for another incorporation service for the same entity. Please select "Add New Entity..." if you want to register a different business structure.'
            };
          }
      }

      return null;
    }

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 32,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32),
          topRight: Radius.circular(32),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            if (_isTwoStepForm) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Step ${_currentPage + 1} of 2',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.corporateBlue,
                    ),
                  ),
                  Container(
                    width: 60,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: _currentPage == 0 ? 1 : 2,
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppTheme.corporateBlue,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                        if (_currentPage == 0)
                          const Expanded(flex: 1, child: SizedBox.shrink()),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            Flexible(
              child: SingleChildScrollView(
                controller: _scrollController,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_currentPage == 0) ...[
                      _buildServiceHeader(),
                      // User Profile Fields (Name, Email, Phone) are hidden in UI but still submitted from controllers
                      // Always show the entity dropdown for all services
                      if (true) ...[
                        const SizedBox(height: 24),
                        Text(
                          'Select Entity for this Service',
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.deepTeal,
                          ),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField2<String>(
                          valueListenable: ValueNotifier(availableEntities.contains(_selectedEntity) ? _selectedEntity : availableEntities.first),
                          isExpanded: true,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.grey[100],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                          iconStyleData: const IconStyleData(
                            icon: Icon(LucideIcons.chevronDown, color: AppTheme.corporateBlue),
                          ),
                          dropdownStyleData: DropdownStyleData(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              color: Colors.white,
                            ),
                            offset: const Offset(0, -4),
                          ),
                          menuItemStyleData: const MenuItemStyleData(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                          ),
                          items: availableEntities.map((entity) {
                            return DropdownItem<String>(
                              value: entity,
                              child: Text(
                                entity,
                                style: GoogleFonts.outfit(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.deepTeal,
                                ),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() {
                              _selectedEntity = val;
                              if (val != null && val != 'Add New Entity...') {
                                _companyNameController.text = val;
                              } else {
                                _companyNameController.clear();
                              }
                            });
                          },
                        ),
                        if (widget.packageName.contains('MCA Compliance') || widget.packageName.contains('GST filing') || widget.packageName.contains('360° Compliance')) ...[
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Text(
                                'Annual Turnover',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.deepTeal,
                                ),
                              ),
                              const Text(' *',
                                  style: TextStyle(
                                      color: Colors.red,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Column(
                            children: _turnoverOptions.map((opt) {
                              return RadioListTile<String>(
                                title: Text(
                                  opt,
                                  style: GoogleFonts.outfit(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.deepTeal,
                                  ),
                                ),
                                value: opt,
                                groupValue: _selectedTurnover,
                                activeColor: AppTheme.corporateBlue,
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                                onChanged: (val) {
                                  setState(() {
                                    _selectedTurnover = val;
                                    _showTurnoverError = false;
                                  });
                                },
                              );
                            }).toList(),
                          ),
                          if (_showTurnoverError)
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0, left: 16.0),
                              child: Text(
                                'This field is required',
                                style: TextStyle(
                                  color: Colors.red.shade700,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                        if (getCompatibilityWarning() != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: getCompatibilityWarning()!['type'] == 'error' ? Colors.red.shade50 : Colors.amber.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: getCompatibilityWarning()!['type'] == 'error' ? Colors.red.shade200 : Colors.amber.shade200,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  getCompatibilityWarning()!['type'] == 'error' ? LucideIcons.alertCircle : LucideIcons.alertTriangle,
                                  color: getCompatibilityWarning()!['type'] == 'error' ? Colors.red.shade600 : Colors.amber.shade700,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        getCompatibilityWarning()!['header']!,
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                          color: getCompatibilityWarning()!['type'] == 'error' ? Colors.red.shade900 : Colors.amber.shade900,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        getCompatibilityWarning()!['message']!,
                                        style: GoogleFonts.outfit(
                                          fontSize: 13,
                                          color: getCompatibilityWarning()!['type'] == 'error' ? Colors.red.shade800 : Colors.amber.shade900,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (_selectedEntity == 'Add New Entity...' && 
                            !(widget.packageName.contains('Incorporation') || 
                              widget.packageName.contains('Proprietorship') || 
                              widget.packageName.contains('OPC'))) ...[
                          const SizedBox(height: 12),
                          _EditableField(
                            label: 'New Entity Name',
                            controller: _customEntityController,
                            icon: LucideIcons.building,
                            hint: 'Enter entity name',
                            isRequired: true,
                            validator: _validateCompanyName,
                          ),
                        ],
                      ],
                      const SizedBox(height: 12),
                      ..._buildServiceSpecificForms(),
                    ] else ...[
                      if (widget.packageName == 'LLP Incorporation' ||
                          widget.packageName == 'Private Limited Incorporation' ||
                          widget.packageName == '360° Compliance') ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader(
                                  'Consent: By submitting this form, I agree to the collection and use of my personal and professional information by Wealth Empires for consultation, compliance assessment, and service-related communication'),
                              _buildModernRadio('Agree', 'Agree', _consent,
                                  (val) => setState(() => _consent = val!)),
                              _buildModernRadio(
                                  'Not Agree',
                                  'Not Agree',
                                  _consent,
                                  (val) => setState(() => _consent = val!)),
                              const SizedBox(height: 24),
                            ],
                          ),
                        ),
                      ],
                      if (_allSlots.isNotEmpty) ...[
                        _buildDocumentSection(),
                      ],
                      const SizedBox(height: 12),
                      _buildNextStepsSection(),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                if (_currentPage == 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 52),
                        side: BorderSide(color: Colors.grey[300]!, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: Colors.grey[800],
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _currentPage = 0;
                        });
                        _scrollController.animateTo(0,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut);
                      },
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 52),
                        side: BorderSide(color: Colors.grey[300]!, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        'Back',
                        style: TextStyle(
                          color: Colors.grey[800],
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                const SizedBox(width: 16),
                if (_currentPage == 0 && _isTwoStepForm)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: (getCompatibilityWarning() != null && getCompatibilityWarning()!['type'] == 'error') ? null : () {
                        if (_formKey.currentState!.validate()) {
                          setState(() {
                            _currentPage = 1;
                          });
                          _scrollController.animateTo(0,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Please fill all required fields.'),
                              backgroundColor: Colors.redAccent,
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        minimumSize: const Size(0, 52),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Next',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ||
                              (!_isTwoStepForm
                                  ? false
                                  : !_areAllRequiredDocsUploaded) ||
                              (getCompatibilityWarning() != null && getCompatibilityWarning()!['type'] == 'error')
                          ? null
                          : () async {
                              bool isTurnoverValid = true;
                              if (widget.packageName.contains('MCA Compliance') || widget.packageName.contains('GST filing') || widget.packageName.contains('360° Compliance')) {
                                if (_selectedTurnover == null) {
                                  isTurnoverValid = false;
                                }
                              }
                              
                              setState(() {
                                _showTurnoverError = !isTurnoverValid;
                              });

                              bool isFormValid = _formKey.currentState!.validate();

                              if (isFormValid && isTurnoverValid) {
                                setState(() => _isLoading = true);
                                final success = await _submitServiceRequest();
                                if (mounted) {
                                  setState(() => _isLoading = false);
                                  if (success) {
                                    Navigator.pop(context);
                                    _showSuccessDialog(context);
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Failed to submit request. Please try again.'),
                                        backgroundColor: Colors.redAccent,
                                      ),
                                    );
                                  }
                                }
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        'Please fill all required fields.'),
                                    backgroundColor: Colors.redAccent,
                                  ),
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        minimumSize: const Size(0, 52),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'Submit',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showSuccessDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.checkCircle2,
                  color: Color(0xFF16A34A), size: 48),
            ),
            const SizedBox(height: 24),
            const Text(
              'Application Submitted',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppTheme.deepTeal,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Our team has received your request and will get back to you shortly.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600], height: 1.4),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.deepTeal,
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text(
                'Done',
                style:
                    TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: AppTheme.packageHeaderDecoration(
          [AppTheme.corporateBlue, const Color(0xFF3B5BDB)]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  widget.packageName == 'Trademark Registration'
                      ? LucideIcons.tag
                      : widget.packageName == 'FSSAI Food License'
                          ? LucideIcons.utensils
                          : LucideIcons.briefcase,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.packageName,
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Service Request Form',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          _buildInfoBox(
            LucideIcons.clock,
            'Processing time: 5-7 business days',
            Colors.white.withValues(alpha: 0.9),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBox(IconData icon, String text, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildServiceSpecificForms() {
    return [
      if (widget.packageName == 'Private Limited Incorporation')
        ..._buildPrivateLimitedForm(),
      if (widget.packageName == 'OPC')
        ..._buildOpcForm(),
      if (widget.packageName == 'Proprietorship')
        ..._buildProprietorshipForm(),
      if (widget.packageName == 'Trade Mark' || widget.packageName == 'Trademark Registration')
        ..._buildTrademarkForm(),
      if (widget.packageName == 'DUNS Number Registration') ..._buildDunsForm(),
      if (widget.packageName == 'LLP Incorporation') ..._buildLlpForm(),
      if (widget.packageName == 'GST filing') ..._buildComplianceForm(),
    ];
  }

  List<Widget> _buildOpcForm() {
    return [
      Text('OPC Incorporation Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Company name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Proposed Company Name',
          isRequired: true,
          validator: _validateCompanyName),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Company phone number',
          controller: _companyPhoneController,
          icon: LucideIcons.phone,
          hint: '10 digit number',
          keyboardType: TextInputType.phone,
          maxLength: 10,
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Number of Partners',
          controller: _numberOfDirectorsController,
          icon: LucideIcons.users,
          hint: 'Number of partners/members',
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Activities',
          controller: _businessActivityController,
          hint: 'Describe the main business activities your company will undertake.',
          maxLines: 3,
          isRequired: true),
      const SizedBox(height: 24),
    ];
  }

  List<Widget> _buildProprietorshipForm() {
    return [
      Text('Proprietorship Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Proposed Business Name',
          isRequired: true,
          validator: _validateCompanyName),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Company Phone Number',
          controller: _companyPhoneController,
          icon: LucideIcons.phone,
          hint: '10 digit number',
          keyboardType: TextInputType.phone,
          maxLength: 10,
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Activities',
          controller: _businessActivityController,
          hint: 'Describe the main business activities.',
          maxLines: 3,
          isRequired: true),
      const SizedBox(height: 24),
    ];
  }



  List<Widget> _buildPrivateLimitedForm() {
    return [
      Text('Incorporation Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Company Name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Proposed Company Name',
          isRequired: true,
          validator: _validateCompanyName),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Company Phone Number',
          controller: _companyPhoneController,
          icon: LucideIcons.phone,
          hint: '10 digit number',
          keyboardType: TextInputType.phone,
          maxLength: 10,
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Number of Directors',
          controller: _numberOfDirectorsController,
          icon: LucideIcons.users,
          hint: 'Number of directors to be appointed',
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Activities',
          controller: _businessActivityController,
          hint: 'Describe the main business activities your company will undertake. Be specific about the products or services you plan to offer.',
          maxLines: 3,
          isRequired: true),
      const SizedBox(height: 24),
    ];
  }

  List<Widget> _buildComplianceForm() {
    return [
      Text('Business Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 16),
      _buildSectionHeader('Expected Annual Turnover'),
      ...[
        'Less than ₹20 Lakhs',
        'Greater than ₹20 Lakhs and Less than ₹50 Lakhs',
        'Greater than ₹50 Lakhs'
      ].map((turnover) => _buildModernRadio(turnover, turnover, _annualTurnover,
          (val) => setState(() => _annualTurnover = val!))),
      const SizedBox(height: 24),
    ];
  }

  List<Widget> _buildTrademarkForm() {
    return [
      Text('Trademark Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Proposed Brand / Logo Name',
          controller: _companyNameController,
          icon: LucideIcons.tag,
          hint: 'Eg: Wealth Empires',
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Address',
          controller: _tmAddressController,
          icon: LucideIcons.mapPin,
          hint: 'Full physical address',
          maxLines: 2,
          isRequired: true),
      const SizedBox(height: 24),
      _buildSectionHeader('Are you already using this brand name?'),
      _buildModernRadio<bool>('Yes, we are already using it', true,
          _isBrandUsed, (val) => setState(() => _isBrandUsed = val!)),
      _buildModernRadio<bool>('No, it is a new brand name', false, _isBrandUsed,
          (val) => setState(() => _isBrandUsed = val!)),
      if (_isBrandUsed) ...[
        const SizedBox(height: 20),
        _EditableField(
            label: 'Brand Usage Date',
            controller: _brandUsageDateController,
            icon: LucideIcons.calendar,
            hint: 'DD-MM-YYYY',
            isDatePicker: true,
            isRequired: true),
      ],
    ];
  }

  List<Widget> _buildMsmeForm() {
    return [
      Text('Enterprise Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 24),
      _EditableField(
          label: 'Name of Enterprise',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Eg: Wealth Empires',
          isRequired: true),
      const SizedBox(height: 24),
      _buildSectionHeader('Type of organization'),
      ...[
        'Proprietorship',
        'Partnership',
        'LLP',
        'Private Limited',
        'OPC',
        'Trust',
        'Society'
      ].map((type) => _buildModernRadio(type, type, _msmeOrgSelection,
          (val) => setState(() => _msmeOrgSelection = val!))),
      const SizedBox(height: 24),
      _buildSectionHeader('Major activity'),
      Row(
        children: [
          Expanded(
              child: _buildModernRadio(
                  'Manufacturing',
                  'Manufacturing',
                  _msmeActivity,
                  (val) => setState(() => _msmeActivity = val!))),
          Expanded(
              child: _buildModernRadio('Service', 'Service', _msmeActivity,
                  (val) => setState(() => _msmeActivity = val!))),
        ],
      ),
      const SizedBox(height: 24),
      _EditableField(
          label: 'Official Address of the enterprise',
          controller: _tmAddressController,
          icon: LucideIcons.mapPin,
          hint: 'Full physical address',
          maxLines: 2,
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
        label: 'Education Qualification',
        controller: TextEditingController(text: _selectedEducation),
        onChanged: (val) {
          setState(() {
            _selectedEducation = val;
          });
        },
        icon: LucideIcons.graduationCap,
        hint: 'e.g., Bachelor\'s Degree, Master\'s, etc.',
        isRequired: true,
      ),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Name of Unit(s) / Plant (s)',
          controller: _msmeUnitsController,
          icon: LucideIcons.factory,
          hint: 'Or enter office address if no separate unit',
          isRequired: true),
      const SizedBox(height: 20),
      Row(
        children: [
          Expanded(
              child: _EditableField(
                  label: 'Official Mobile',
                  controller: _companyPhoneController,
                  icon: LucideIcons.phone,
                  hint: 'Business mobile',
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'Official Mail ID',
                  controller: _companyEmailController,
                  icon: LucideIcons.mail,
                  hint: 'Business email',
                  keyboardType: TextInputType.emailAddress,
                  isRequired: true)),
        ],
      ),
      const SizedBox(height: 20),
      Row(
        children: [
          Expanded(
              child: _EditableField(
                  label: 'Male Employees',
                  controller: _msmeMaleEmployeesController,
                  icon: LucideIcons.user,
                  hint: 'Count',
                  keyboardType: TextInputType.number,
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'Female Employees',
                  controller: _msmeFemaleEmployeesController,
                  icon: LucideIcons.userPlus,
                  hint: 'Count',
                  keyboardType: TextInputType.number,
                  isRequired: true)),
        ],
      ),
      const SizedBox(height: 20),
      Row(
        children: [
          Expanded(
              child: _EditableField(
                  label: 'Inc. Date',
                  controller: _msmeIncDateController,
                  icon: LucideIcons.calendar,
                  hint: 'DD/MM/YYYY',
                  isDatePicker: true,
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'Commence. Date',
                  controller: _msmeCommenceDateController,
                  icon: LucideIcons.calendarCheck,
                  hint: 'DD/MM/YYYY',
                  isDatePicker: true,
                  isRequired: true)),
        ],
      ),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Previous MSME / Udyog Aadhaar (if any)',
          controller: _msmePrevUdyamController,
          icon: LucideIcons.shieldCheck,
          hint: 'Leave blank if not applicable',
          isRequired: false),
      const SizedBox(height: 20),
      _EditableField(
          label: 'GST number (if available)',
          controller: _msmeGstNumberController,
          icon: LucideIcons.fileText,
          hint: 'Registered GSTIN',
          isRequired: false),
      const SizedBox(height: 20),
      Row(
        children: [
          Expanded(
              child: _EditableField(
                  label: 'Total Investment',
                  controller: _msmeInvestmentController,
                  icon: LucideIcons.indianRupee,
                  hint: 'e.g. Rs.10,000',
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'Total Annual Turnover',
                  controller: _msmeTurnoverController,
                  icon: LucideIcons.banknote,
                  hint: 'e.g. Rs.1,00,000',
                  isRequired: true)),
        ],
      ),
    ];
  }

  List<Widget> _buildDunsForm() {
    return [
      Text('DUNS Registration Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 24),
      _EditableField(
          label: 'Legal Business Name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'As per official records',
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Trade Name (if any)',
          controller: _dunsTradeNameController,
          icon: LucideIcons.tag,
          hint: 'Doing business as...',
          isRequired: false),
      const SizedBox(height: 20),
      _buildSectionHeader('Business Type'),
      ...[
        'Private Limited',
        'LLP',
        'Sole Proprietorship',
        'Partnership',
        'Other'
      ].map((type) => _buildModernRadio(type, type, _dunsBusinessType,
          (val) => setState(() => _dunsBusinessType = val!))),
      const SizedBox(height: 24),
      Row(
        children: [
          Expanded(
              child: _EditableField(
                  label: 'Year of Establishment',
                  controller: _dunsYearController,
                  icon: LucideIcons.calendar,
                  hint: 'YYYY',
                  keyboardType: TextInputType.number,
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'Number of Employees',
                  controller: _fssaiEmployeesController,
                  icon: LucideIcons.users2,
                  hint: 'Total count',
                  keyboardType: TextInputType.number,
                  isRequired: true)),
        ],
      ),
    ];
  }

  List<Widget> _buildLlpForm() {
    return [
      Text('LLP Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 16),
      _EditableField(
          label: 'Proposed LLP name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Eg: Wealth Empires LLP',
          isRequired: true,
          validator: _validateCompanyName),
      const SizedBox(height: 12),
      _EditableField(
          label: 'Number of Partners',
          controller: _numberOfDirectorsController,
          icon: LucideIcons.users,
          hint: 'Number of partners in the LLP',
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          isRequired: true),
      const SizedBox(height: 12),
      Text(
          'Enter your preferred LLP company name. This should be unique and not already registered. Avoid using words like "National", "Federal", "Central", "Republic", "Democracy", "Government" without proper authorization.',
          style: TextStyle(color: Colors.grey[600], fontSize: 11, height: 1.4)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Activity',
          controller: _businessActivityController,
          hint: 'Describe the main business activities your company will undertake. Be specific about the products or services you plan to offer.',
          maxLines: 3,
          isRequired: true),
      const SizedBox(height: 24),
      _buildSectionHeader('Registered Office Preference'),
      _buildModernRadio('Do you have address for your company', 'Own Address',
          _officePreference, (val) => setState(() => _officePreference = val!)),
      _buildModernRadio(
          'Do you want virtual office for your company',
          'Virtual Office',
          _officePreference,
          (val) => setState(() => _officePreference = val!)),
      if (_officePreference == 'Own Address') ...[
        const SizedBox(height: 24),
        _EditableField(
            label: 'Name of the Owner in the utility bill',
            controller: _ownerNameController,
            icon: LucideIcons.user,
            hint: 'As per EB/Wifi bill',
            isRequired: true),
      ],
      const SizedBox(height: 20),
      _EditableField(
          label: 'Total Capital Contribution',
          controller: _paidUpCapitalController,
          icon: LucideIcons.indianRupee,
          hint: 'Total capital by all partners',
          keyboardType: TextInputType.number,
          isRequired: true),
    ];
  }

  List<Widget> _buildFssaiForm() {
    return [
      Text('FSSAI License Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 8),
      Text('Enter your business details correctly',
          style: TextStyle(color: Colors.grey[600], fontSize: 13)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Name of Business',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Registered entity name',
          isRequired: true),
      const SizedBox(height: 20),
      _buildSectionHeader('Type of Business'),
      ...[
        'Proprietorship',
        'Partnership',
        'LLP',
        'Private Limited Company',
        'One Person Company',
        'Other'
      ].map((type) => _buildModernRadio(type, type, _fssaiBusinessType,
          (val) => setState(() => _fssaiBusinessType = val!))),
      const SizedBox(height: 24),
      _buildSectionHeader('Nature of Food Business'),
      const Text('(Select all applicable)',
          style: TextStyle(fontSize: 11, color: Colors.grey)),
      const SizedBox(height: 12),
      ..._fssaiNatureOptions.map((nature) => CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(nature,
                style:
                    const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            value: _selectedFssaiNatures.contains(nature),
            activeColor: AppTheme.corporateBlue,
            onChanged: (val) {
              setState(() {
                if (val == true) {
                  _selectedFssaiNatures.add(nature);
                } else {
                  _selectedFssaiNatures.remove(nature);
                }
              });
            },
            controlAffinity: ListTileControlAffinity.leading,
          )),
      const SizedBox(height: 24),
      _EditableField(
          label: 'When did your business start?',
          controller: _fssaiStartDateController,
          icon: LucideIcons.calendar,
          hint: 'DD/MM/YYYY',
          isDatePicker: true,
          isRequired: true),
      const SizedBox(height: 20),
      _buildSectionHeader('Expected Annual Turnover'),
      ...['Below ₹12 Lakhs', '₹12 Lakhs – ₹20 Crores', 'Above ₹20 Crores'].map(
          (to) => _buildModernRadio(to, to, _fssaiTurnover,
              (val) => setState(() => _fssaiTurnover = val!))),
      const SizedBox(height: 24),
      _EditableField(
          label: 'No. of Employees',
          controller: _fssaiEmployeesController,
          icon: LucideIcons.users2,
          hint: 'Total staff count',
          keyboardType: TextInputType.number,
          isRequired: true),
      const SizedBox(height: 20),
      _buildSectionHeader('Premises Type'),
      Row(
        children: [
          Expanded(
              child: _buildModernRadio('Own', 'Own', _fssaiPremisesType,
                  (val) => setState(() => _fssaiPremisesType = val!))),
          Expanded(
              child: _buildModernRadio('Rent', 'Rent', _fssaiPremisesType,
                  (val) => setState(() => _fssaiPremisesType = val!))),
        ],
      ),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Address of Premises',
          controller: _fssaiPremisesAddressController,
          icon: LucideIcons.mapPin,
          hint: 'Door / Building / Street / Area...',
          maxLines: 2,
          isRequired: true),
      const SizedBox(height: 20),
      Row(
        children: [
          Expanded(
              child: _EditableField(
                  label: 'Village',
                  controller: _fssaiVillageController,
                  icon: LucideIcons.map,
                  hint: 'Town/Village',
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'District',
                  controller: _fssaiDistrictController,
                  icon: LucideIcons.mapPin,
                  hint: 'City/District',
                  isRequired: true)),
        ],
      ),
      const SizedBox(height: 24),
      _buildSectionHeader(
          'Is your correspondence Address same as "Address of Premises"'),
      Row(
        children: [
          Expanded(
              child: _buildModernRadio<bool>('Yes', true, _isCorrespondenceSame,
                  (val) => setState(() => _isCorrespondenceSame = val!))),
          Expanded(
              child: _buildModernRadio<bool>('No', false, _isCorrespondenceSame,
                  (val) => setState(() => _isCorrespondenceSame = val!))),
        ],
      ),
      if (!_isCorrespondenceSame) ...[
        const SizedBox(height: 24),
        Text('Correspondence Address',
            style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: AppTheme.deepTeal)),
        const SizedBox(height: 16),
        _EditableField(
            label: 'Correspondence Address',
            controller: _fssaiCorrAddressController,
            icon: LucideIcons.mail,
            hint: 'Full physical address',
            maxLines: 2,
            isRequired: true),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
                child: _EditableField(
                    label: 'Village',
                    controller: _fssaiCorrVillageController,
                    icon: LucideIcons.map,
                    hint: 'Village',
                    isRequired: true)),
            const SizedBox(width: 16),
            Expanded(
                child: _EditableField(
                    label: 'District',
                    controller: _fssaiCorrDistrictController,
                    icon: LucideIcons.mapPin,
                    hint: 'District',
                    isRequired: true)),
          ],
        ),
      ],
      const SizedBox(height: 32),
      Row(
        children: [
          Checkbox(
              value: _fssaiDeclaration,
              activeColor: AppTheme.corporateBlue,
              onChanged: (val) =>
                  setState(() => _fssaiDeclaration = val ?? false)),
          Expanded(
              child: Text(
                  'I hereby declare that all information provided is true and correct to the best of my knowledge.',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[700]))),
          const Text(' *',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
        ],
      ),
    ];
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(title,
                style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.deepTeal.withValues(alpha: 0.8))),
          ),
          const Text(' *',
              style: TextStyle(
                  color: Colors.red,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildModernRadio<T>(
      String title, T value, T groupValue, ValueChanged<T?> onChanged) {
    return RadioListTile<T>(
      contentPadding: EdgeInsets.zero,
      title: Text(title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      value: value,
      groupValue: groupValue,
      activeColor: AppTheme.corporateBlue,
      onChanged: onChanged,
      controlAffinity: ListTileControlAffinity.leading,
    );
  }

  Widget _buildDocumentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
                widget.packageName == 'FSSAI Food License'
                    ? 'Upload Documents * (Max 2MB)'
                    : 'Upload Documents *',
                style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.deepTeal)),
            Text('(Max 2MB/file)',
                style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 16),
        ..._allSlots.map((slotName) {
          final files = _documentSlots[slotName] ?? [];
          final isOther = slotName == 'Other Documents';
          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                        isOther
                            ? LucideIcons.plusCircle
                            : LucideIcons.fileCheck2,
                        size: 16,
                        color: isOther
                            ? Colors.grey[400]!
                            : AppTheme.corporateBlue),
                    const SizedBox(width: 8),
                    Text(slotName,
                        style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isOther
                                ? Colors.grey[600]
                                : AppTheme.deepTeal)),
                  ],
                ),
                const SizedBox(height: 12),
                if (files.isNotEmpty)
                  ...files.asMap().entries.map((entry) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                                child: Text(entry.value.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.deepTeal))),
                            if (entry.value.path != null)
                              IconButton(
                                  icon: const Icon(LucideIcons.eye, size: 14),
                                  color: AppTheme.corporateBlue,
                                  onPressed: () =>
                                      OpenFilex.open(entry.value.path!),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints()),
                            if (entry.value.path != null)
                              const SizedBox(width: 8),
                            IconButton(
                                icon: const Icon(LucideIcons.trash2, size: 14),
                                color: Colors.red[400],
                                onPressed: () =>
                                    _removeFile(slotName, entry.key),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints()),
                          ],
                        ),
                      )),
                InkWell(
                  onTap: () => _pickFiles(slotName),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: AppTheme.corporateBlue.withValues(alpha: 0.02)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.uploadCloud,
                            size: 16, color: AppTheme.corporateBlue),
                        const SizedBox(width: 8),
                        Text(
                            files.isEmpty
                                ? 'Upload $slotName'
                                : 'Add More Files',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppTheme.corporateBlue,
                                fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildNextStepsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(20),
          border:
              Border.all(color: AppTheme.corporateBlue.withValues(alpha: 0.1))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.helpCircle,
                  color: AppTheme.corporateBlue, size: 20),
              SizedBox(width: 8),
              Text('What happens next?',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.deepTeal,
                      fontSize: 15)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
              'Your service request will be submitted to our team. We will contact you at this number within 24 hours.',
              style: TextStyle(
                  color: Colors.grey[600], fontSize: 13, height: 1.5)),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                color: AppTheme.deepTeal.withValues(alpha: 0.8),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.deepTeal.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: AppTheme.deepTeal.withValues(alpha: 0.15),
                    width: 1,
                  ),
                ),
                child: Text(
                  value,
                  style: GoogleFonts.outfit(
                    color: AppTheme.deepTeal,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
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

class _EditableField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final dynamic icon;
  final String hint;
  final TextInputType keyboardType;
  final int? maxLength;
  final int maxLines;
  final List<TextInputFormatter>? inputFormatters;
  final bool isPhoneField;
  final bool isPhoneValid;
  final bool isRequired;
  final bool isDatePicker;
  final bool isPanField;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;

  const _EditableField({
    required this.label,
    required this.controller,
    this.icon,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.maxLength,
    this.maxLines = 1,
    this.inputFormatters,
    this.isPhoneField = false,
    this.isPhoneValid = true,
    this.isRequired = false,
    this.isDatePicker = false,
    this.isPanField = false,
    this.onChanged,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.deepTeal.withValues(alpha: 0.8),
                  letterSpacing: 0.5,
                ),
              ),
              if (isRequired)
                const Text(' *',
                    style: TextStyle(
                        color: Colors.red,
                        fontSize: 13,
                        fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: (isPhoneField && !isPhoneValid)
                    ? Colors.red.withValues(alpha: 0.2)
                    : Colors.transparent,
              ),
            ),
            child: TextFormField(
              controller: controller,
              onChanged: onChanged,
              validator: validator ??
                  (isRequired
                      ? (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'This field is required';
                          }
                          if (isPhoneField && value.length < 10) {
                            return 'Enter valid 10-digit number';
                          }
                          return null;
                        }
                      : null),
              keyboardType: keyboardType,
              maxLength: maxLength,
              maxLines: maxLines,
              readOnly: isDatePicker,
              onTap: isDatePicker
                  ? () async {
                      DateTime? pickedDate = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(1900),
                        lastDate: DateTime(2100),
                      );
                      if (pickedDate != null) {
                        String formattedDate =
                            "${pickedDate.month.toString().padLeft(2, '0')}/${pickedDate.day.toString().padLeft(2, '0')}/${pickedDate.year}";
                        controller.text = formattedDate;
                        if (onChanged != null) {
                          onChanged!(formattedDate);
                        }
                      }
                    }
                  : null,
              inputFormatters: inputFormatters,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: AppTheme.deepTeal,
                fontSize: 15,
                letterSpacing: isPhoneField ? 1.5 : 0.2,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 14,
                  letterSpacing: 0,
                ),
                prefixIcon: icon == null
                    ? null
                    : (maxLines > 1
                        ? Container(
                            padding: const EdgeInsets.only(top: 16, left: 16),
                            alignment: Alignment.topLeft,
                            width: 48,
                            child: icon is IconData
                                ? Icon(icon,
                                    size: icon == HugeIcons.strokeRoundedUserIdVerification ? 16 : 18)
                                : Transform.scale(
                                    scale: 0.65,
                                    child: HugeIcon(
                                        icon: icon, color: Colors.grey[600] ?? Colors.grey, size: 18.0),
                                  ),
                          )
                        : (icon is IconData
                            ? Icon(icon,
                                size: icon == HugeIcons.strokeRoundedUserIdVerification ? 16 : 18)
                            : Transform.scale(
                                scale: 0.65,
                                child: HugeIcon(
                                    icon: icon, color: Colors.grey[600] ?? Colors.grey, size: 18.0),
                              ))),
                suffixIcon: (label.contains('Full Name') ||
                        label.contains('Email Address') ||
                        label.contains('Verification Phone Number'))
                    ? const Icon(LucideIcons.pencil,
                        size: 18, color: AppTheme.corporateBlue)
                    : null,
                counterText: '',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.black.withOpacity(0.15)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.black.withOpacity(0.15)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black, width: 1.5),
                ),
                contentPadding: EdgeInsets.symmetric(
                    vertical: 16, horizontal: icon == null ? 16 : 0),
              ),
            ),
          ),
          if (isPanField)
            Consumer(
              builder: (context, ref, child) {
                final savedPans = ref.watch(panProvider);
                if (savedPans.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Saved PAN Details (Tap to auto-fill):',
                          style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      ...savedPans.map((pan) {
                        return InkWell(
                          onTap: () {
                            controller.text = pan.panNumber;
                            if (onChanged != null) onChanged!(pan.panNumber);
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 4),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.corporateBlue
                                  .withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: AppTheme.corporateBlue
                                      .withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.creditCard,
                                    size: 16, color: AppTheme.corporateBlue),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${pan.panNumber} - ${pan.name}',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.deepTeal),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
