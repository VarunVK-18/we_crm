import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/ocr_service.dart';
import '../../providers/pan_provider.dart';
import '../../core/constants/service_documents.dart';
import '../../providers/auth_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/constants/port.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../models/director_form_data.dart';
import 'package:open_file/open_file.dart';

class ServiceRequestSummarySheet extends ConsumerStatefulWidget {
  final String packageName;

  const ServiceRequestSummarySheet({
    super.key,
    required this.packageName,
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
  
  final _formKey = GlobalKey<FormState>();
  int _currentPage = 0;
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();

  final List<DirectorFormData> _directors = [DirectorFormData()];

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
    final servicesWithCustomForms = [
      'LLP Incorporation',
      'Private Limited Incorporation',
      'Trade Mark',
      'Trademark Registration',
      'DPIIT',
      'DPIIT Startup India Certification',
      'MSME',
      'MSME Certification',
      'GST',
      'GST Registration',
      'ISO',
      'ISO Registration',
      'FSSAI',
      'FSSAI Registration'
    ];
    return !servicesWithCustomForms.any((s) => widget.packageName.contains(s));
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

  @override
  void initState() {
    super.initState();
    // Initialize with current profile info if available
    final userProfile = ref.read(userProfileProvider).value;
    _phoneController = TextEditingController(text: userProfile?.phone ?? '');
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
      final result = await FilePicker.platform.pickFiles(
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

    for (var director in _directors) {
      director.dispose();
    }
    _scrollController.dispose();

    super.dispose();
  }

  Future<void> _submitServiceRequest() async {
    final userProfile = ref.read(userProfileProvider).value;
    if (userProfile == null) return;

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
        request.fields['company_name'] = _companyNameController.text;
        request.fields['entity_name'] = _companyNameController.text;
      }

      // Collect package-specific details
      final Map<String, String> details = {};
      if (!_isTwoStepForm) {
        details['Status'] = 'Pending Client Form Submission';
        details['Next Step'] = 'Assign expert to unlock form for client';
      } else if (widget.packageName == 'FSSAI Food License') {
        details['fssai_business_type'] = _fssaiBusinessType;
        details['fssai_turnover'] = _fssaiTurnover;
        details['fssai_premises_type'] = _fssaiPremisesType;
        details['fssai_nature_of_business'] = _selectedFssaiNatures.join(', ');
        details['fssai_start_date'] = _fssaiStartDateController.text;
        details['fssai_employees'] = _fssaiEmployeesController.text;
        details['fssai_premises_address'] = _fssaiPremisesAddressController.text;
        details['fssai_village'] = _fssaiVillageController.text;
        details['fssai_district'] = _fssaiDistrictController.text;
        details['is_correspondence_same'] = _isCorrespondenceSame ? 'true' : 'false';
        if (!_isCorrespondenceSame) {
          details['fssai_corr_address'] = _fssaiCorrAddressController.text;
          details['fssai_corr_village'] = _fssaiCorrVillageController.text;
          details['fssai_corr_district'] = _fssaiCorrDistrictController.text;
        }
      } else if (widget.packageName == 'DUNS Number Registration') {
        details['duns_trade_name'] = _dunsTradeNameController.text;
        details['duns_year'] = _dunsYearController.text;
        details['duns_employees'] = _fssaiEmployeesController.text;
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

      // Add person files for LLP
      if (widget.packageName == 'LLP Incorporation') {
        for (int i = 0; i < _directors.length; i++) {
          final director = _directors[i];
          final prefix = 'director_${i + 1}_';
          
          if (director.photoPath != null) {
            request.files.add(await http.MultipartFile.fromPath('${prefix}photo', director.photoPath!));
          }
          if (director.signaturePath != null) {
            request.files.add(await http.MultipartFile.fromPath('${prefix}signature', director.signaturePath!));
          }
          if (director.addressProofPath != null) {
            request.files.add(await http.MultipartFile.fromPath('${prefix}addressProof', director.addressProofPath!));
          }
          if (director.aadhaarPath != null) {
            request.files.add(await http.MultipartFile.fromPath('${prefix}aadhaar', director.aadhaarPath!));
          }
          if (director.panPath != null) {
            request.files.add(await http.MultipartFile.fromPath('${prefix}pan', director.panPath!));
          }
        }
      }

      final streamedResponse =
          await request.send().timeout(const Duration(seconds: 25));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        debugPrint(
            'Successfully registered service and uploaded documents on backend: ${widget.packageName}');
      } else {
        debugPrint('Failed to register service on backend: ${response.body}');
      }
    } catch (e) {
      debugPrint('Error registering service: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
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
                      Text(
                        'Service Request Details',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 32),
        
                      _EditableField(
                        label: 'Full Name',
                        controller: _nameController,
                        icon: LucideIcons.user,
                        hint: 'Enter your name',
                        isRequired: true,
                      ),
                      const SizedBox(height: 20),
        
                      _EditableField(
                        label: 'Email Address',
                        controller: _emailController,
                        icon: LucideIcons.mail,
                        hint: 'name@example.com',
                        keyboardType: TextInputType.emailAddress,
                        isRequired: true,
                      ),
                      const SizedBox(height: 20),
        
                      _EditableField(
                        label: 'Verification Phone Number',
                        controller: _phoneController,
                        icon: LucideIcons.phone,
                        hint: 'Enter 10 digit number',
                        keyboardType: TextInputType.phone,
                        maxLength: 10,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        isPhoneField: true,
                        isPhoneValid: _isPhoneValid,
                        isRequired: true,
                      ),
                      const SizedBox(height: 24),
        
                      _DetailRow(label: 'Package:', value: widget.packageName),
        
                      ..._buildServiceSpecificForms(),
                    ] else ...[
                      if (widget.packageName == 'LLP Incorporation') ...[
                        ..._buildPrivateLimitedPersons(),
                      ],
                      if (widget.packageName == 'LLP Incorporation' || widget.packageName == 'Private Limited Incorporation') ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader('Consent: By submitting this form, I agree to the collection and use of my personal and professional information by Wealth Empires for consultation, compliance assessment, and service-related communication'),
                              _buildModernRadio('Agree', 'Agree', _consent, (val) => setState(() => _consent = val!)),
                              _buildModernRadio('Not Agree', 'Not Agree', _consent, (val) => setState(() => _consent = val!)),
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
                        minimumSize: const Size(0, 56),
                        side: BorderSide(color: Colors.grey[300]!),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: Colors.grey[700],
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
                        _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                      },
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 56),
                        side: BorderSide(color: Colors.grey[300]!),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        'Back',
                        style: TextStyle(
                          color: Colors.grey[700],
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
                      onPressed: () {
                        if (_formKey.currentState!.validate()) {
                          setState(() {
                            _currentPage = 1;
                          });
                          _scrollController.animateTo(0, duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
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
                        backgroundColor: AppTheme.corporateBlue,
                        minimumSize: const Size(0, 56),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
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
                      onPressed: _isLoading || (!_isTwoStepForm ? false : !_areAllRequiredDocsUploaded) ? null : () async {
                        if (_formKey.currentState!.validate()) {
                          setState(() => _isLoading = true);
                          await _submitServiceRequest();
                          if (mounted) {
                            setState(() => _isLoading = false);
                            Navigator.pop(context);
                            _showSuccessDialog(context);
                          }
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
                        backgroundColor: AppTheme.corporateBlue,
                        minimumSize: const Size(0, 56),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
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
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    Text(
                      'Service Request Form',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
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
      if (widget.packageName == 'Trademark Registration')
        ..._buildTrademarkForm(),
      if (widget.packageName == 'MSME Certification') ..._buildMsmeForm(),
      if (widget.packageName == 'DUNS Number Registration') ..._buildDunsForm(),
      if (widget.packageName == 'LLP Incorporation') ..._buildLlpForm(),
      if (widget.packageName == 'FSSAI Food License') ..._buildFssaiForm(),
    ];
  }

  List<Widget> _buildPrivateLimitedForm() {
    return [
      const SizedBox(height: 32),
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
          isRequired: true),
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
          icon: LucideIcons.briefcase,
          hint: 'Describe the main business activities',
          maxLines: 4,
          isRequired: true),
      const SizedBox(height: 24),
    ];
  }

  List<Widget> _buildTrademarkForm() {
    return [
      const SizedBox(height: 32),
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
      const SizedBox(height: 32),
      Text('Udyam Registration Details',
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
      const SizedBox(height: 32),
      Text('Application Details',
          style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
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
      const SizedBox(height: 32),
      Text('Proposed LLP Details',
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
          isRequired: true),
      const SizedBox(height: 12),
      Text(
          'Enter your preferred LLP company name. This should be unique and not already registered. Avoid using words like "National", "Federal", "Central", "Republic", "Democracy", "Government" without proper authorization.',
          style: TextStyle(color: Colors.grey[600], fontSize: 11, height: 1.4)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Business Activity',
          controller: _businessActivityController,
          icon: LucideIcons.fileText,
          hint: 'Describe the main business activities...',
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
      const SizedBox(height: 32),
      Text('Business Details',
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(title,
                style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.deepTeal.withValues(alpha: 0.6))),
          ),
          const Text(' *',
              style: TextStyle(
                  color: Colors.red, fontSize: 13, fontWeight: FontWeight.w800)),
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
                            border: Border.all(color: Colors.grey[200]!)),
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
                                      OpenFile.open(entry.value.path!),
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
                        border: Border.all(
                            color:
                                AppTheme.corporateBlue.withValues(alpha: 0.2),
                            style: BorderStyle.solid),
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

  Future<void> _pickDirectorFile(DirectorFormData director, String fieldName, {List<String> allowedExtensions = const ['pdf', 'jpg', 'jpeg', 'png']}) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: allowedExtensions,
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.size <= 2 * 1024 * 1024) {
          setState(() {
            switch (fieldName) {
              case 'photo': director.photoPath = file.path; break;
              case 'signature': director.signaturePath = file.path; break;
              case 'addressProof': director.addressProofPath = file.path; break;
              case 'aadhaar': director.aadhaarPath = file.path; break;
              case 'pan': director.panPath = file.path; break;
            }
          });
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Warning: File is large. Max 2MB allowed')));
          }
        }
      }
    } catch (e) {
      debugPrint('Error picking file: $e');
    }
  }

  Widget _buildDirectorFileUpload(DirectorFormData director, String label, String hint, String fieldName) {
    String? currentPath;
    switch (fieldName) {
      case 'photo': currentPath = director.photoPath; break;
      case 'signature': currentPath = director.signaturePath; break;
      case 'addressProof': currentPath = director.addressProofPath; break;
      case 'aadhaar': currentPath = director.aadhaarPath; break;
      case 'pan': currentPath = director.panPath; break;
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.deepTeal.withValues(alpha: 0.6))),
            const Text(' *', style: TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 4),
        Text(hint, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
        const SizedBox(height: 8),
        InkWell(
          onTap: currentPath == null ? () => _pickDirectorFile(director, fieldName) : null,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
              border: Border.all(color: currentPath != null ? AppTheme.corporateBlue : Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12),
              color: currentPath != null ? AppTheme.corporateBlue.withValues(alpha: 0.05) : Colors.transparent,
            ),
            child: Row(
              children: [
                Icon(
                  currentPath != null ? LucideIcons.fileCheck2 : LucideIcons.uploadCloud,
                  size: 20,
                  color: currentPath != null ? AppTheme.corporateBlue : Colors.grey[500],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    currentPath != null ? currentPath.split('/').last.split('\\\\').last : 'Upload 1 supported file. Max 2 MB.',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: currentPath != null ? AppTheme.corporateBlue : Colors.grey[500]!,
                      fontSize: 13,
                    ),
                  ),
                ),
                if (currentPath != null) ...[
                  const SizedBox(width: 8),
                  // View icon
                  IconButton(
                    iconSize: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      if (currentPath != null) {
                        OpenFile.open(currentPath);
                      }
                    },
                    icon: const Icon(
                      LucideIcons.eye,
                      color: AppTheme.corporateBlue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Delete icon
                  IconButton(
                    iconSize: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () {
                      setState(() {
                        switch (fieldName) {
                          case 'photo':
                            director.photoPath = null;
                            break;
                          case 'signature':
                            director.signaturePath = null;
                            break;
                          case 'addressProof':
                            director.addressProofPath = null;
                            break;
                          case 'aadhaar':
                            director.aadhaarPath = null;
                            break;
                          case 'pan':
                            director.panPath = null;
                            break;
                        }
                      });
                    },
                    icon: Icon(
                      LucideIcons.trash2,
                      color: Colors.red[400],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  List<Widget> _buildPrivateLimitedPersons() {
    return [
      const SizedBox(height: 24),
      ..._directors.asMap().entries.map((entry) {
        int index = entry.key;
        DirectorFormData data = entry.value;
        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Person ${index + 1} Registration', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
                  if (_directors.length > 1)
                    IconButton(
                      icon: const Icon(LucideIcons.trash2, color: Colors.red),
                      onPressed: () => setState(() => _directors.removeAt(index)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text('Please provide the following information for registration (Later it can\'t be changed)',
                  style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              const SizedBox(height: 24),

              _EditableField(label: 'Full name', controller: data.fullNameController, icon: LucideIcons.user, hint: 'First name, middle name (if any), and last name.', isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Father\'s name', controller: data.fatherNameController, icon: LucideIcons.user, hint: 'As it appears on official documents.', isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'DOB', controller: data.dobController, icon: LucideIcons.calendar, hint: 'DD/MM/YYYY', isRequired: true, isDatePicker: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Place of birth', controller: data.placeOfBirthController, icon: LucideIcons.mapPin, hint: 'City and state', isRequired: true),
              const SizedBox(height: 24),
              _buildSectionHeader('Nationality'),
              _buildModernRadio('Indian', 'Indian', data.nationality, (val) => setState(() => data.nationality = val!)),
              _buildModernRadio('Others', 'Others', data.nationality, (val) => setState(() => data.nationality = val!)),
              const SizedBox(height: 24),
              _EditableField(label: 'Occupation', controller: data.occupationController, icon: LucideIcons.briefcase, hint: 'Business, Employment, etc.', isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Education', controller: data.educationController, icon: LucideIcons.graduationCap, hint: 'Enter education', isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Email', controller: data.emailController, icon: LucideIcons.mail, hint: 'Personal email address', keyboardType: TextInputType.emailAddress, isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Phone number', controller: data.phoneController, icon: LucideIcons.phone, hint: 'Mobile number', keyboardType: TextInputType.phone, isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Address', controller: data.addressController, icon: LucideIcons.map, hint: 'Residential address with Pin code', isRequired: true, maxLines: 3),
              const SizedBox(height: 20),
              _EditableField(label: 'PAN', controller: data.panController, icon: LucideIcons.creditCard, hint: '10-character PAN', isRequired: true, isPanField: true),
              const SizedBox(height: 20),
              _EditableField(label: 'Aadhaar Number', controller: data.aadhaarController, icon: HugeIcons.strokeRoundedUserIdVerification, hint: '12-digit Aadhaar number', isRequired: true),
              const SizedBox(height: 20),
              _EditableField(label: 'DIN Number', controller: data.dinController, icon: LucideIcons.hash, hint: '8-digit DIN (Leave blank if first directorship)'),
              const SizedBox(height: 24),

              _buildSectionHeader('I need DSC'),
              _buildModernRadio('Yes', 'Yes', data.needDsc, (val) => setState(() => data.needDsc = val!)),
              _buildModernRadio('No', 'No', data.needDsc, (val) => setState(() => data.needDsc = val!)),
              _buildModernRadio('Maybe', 'Maybe', data.needDsc, (val) => setState(() => data.needDsc = val!)),
              const SizedBox(height: 24),

              _buildSectionHeader('Role in the company'),
              if (widget.packageName == 'LLP Incorporation') ...[
                _buildModernRadio('Designated Partner', 'Designated Partner', data.role, (val) => setState(() => data.role = val!)),
                _buildModernRadio('Partner', 'Partner', data.role, (val) => setState(() => data.role = val!)),
              ] else ...[
                _buildModernRadio('Director', 'Director', data.role, (val) => setState(() => data.role = val!)),
                _buildModernRadio('Shareholder', 'Shareholder', data.role, (val) => setState(() => data.role = val!)),
                _buildModernRadio('Director & Shareholder', 'Director & Shareholder', data.role, (val) => setState(() => data.role = val!)),
              ],
              const SizedBox(height: 20),
              
              if (widget.packageName == 'LLP Incorporation') ...[
                _EditableField(label: 'Fixed Capital Contribution', controller: data.fixedCapitalController, icon: LucideIcons.indianRupee, hint: 'Fixed capital amount', keyboardType: TextInputType.number, isRequired: true),
                const SizedBox(height: 20),
                _EditableField(label: 'Profit sharing ratio (%)', controller: data.profitSharingController, icon: LucideIcons.percent, hint: 'Profit sharing percentage', keyboardType: TextInputType.number, isRequired: true),
              ] else ...[
                _EditableField(label: 'Share holding percentage', controller: data.shareholdingController, icon: LucideIcons.percent, hint: '0 to 100', keyboardType: TextInputType.number, isRequired: true),
              ],
              const SizedBox(height: 24),

              _buildSectionHeader('I\'m Authorized signatory (Select "Yes" if you will be an authorized signatory for the company\'s bank accounts and official documents. Yes, I want to be the authorized signatory)'),
              _buildModernRadio('Yes', 'Yes', data.isAuthSignatory, (val) => setState(() => data.isAuthSignatory = val!)),
              _buildModernRadio('No', 'No', data.isAuthSignatory, (val) => setState(() => data.isAuthSignatory = val!)),
              const SizedBox(height: 24),

              _buildDirectorFileUpload(data, 'Photo', 'Upload a recent passport-size photograph (3.5cm x 4.5cm) with a white background.', 'photo'),
              _buildDirectorFileUpload(data, 'Signature', 'Upload a clear image of your signature. This is required if you are an authorized signatory.', 'signature'),
              _buildDirectorFileUpload(data, 'Residential address proof', 'Upload proof of your residential address (utility bill, bank statement, etc.). This proof should be on the name of the person and should not be older than two months', 'addressProof'),
              _buildDirectorFileUpload(data, 'Aadhaar Card', 'Upload Aadhaar card with front and back side pdf. The system will verify the document using OCR and cross-check with the details provided above.', 'aadhaar'),
              _buildDirectorFileUpload(data, 'PAN Card', 'Upload PAN card. The system will verify the document using OCR and cross-check with the details provided above.', 'pan'),
            ],
          ),
        );
      }),
      OutlinedButton.icon(
        onPressed: () {
          setState(() {
            _directors.add(DirectorFormData());
          });
        },
        icon: const Icon(LucideIcons.plus, size: 18),
        label: const Text('Add Person', style: TextStyle(fontWeight: FontWeight.bold)),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 50),
          side: const BorderSide(color: AppTheme.corporateBlue),
          foregroundColor: AppTheme.corporateBlue,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      const SizedBox(height: 24),
    ];
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[500],
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppTheme.deepTeal,
                fontWeight: FontWeight.w800,
                fontSize: 14,
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
    required this.icon,
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
    return Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: isPhoneField
                    ? AppTheme.corporateBlue
                    : AppTheme.deepTeal.withValues(alpha: 0.6),
                letterSpacing: 0.5,
              ),
            ),
            if (isRequired)
              const Text(' *',
                  style: TextStyle(
                      color: Colors.red,
                      fontSize: 13,
                      fontWeight: FontWeight.w800)),
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
            validator: validator ?? (isRequired ? (value) {
              if (value == null || value.trim().isEmpty) {
                return 'This field is required';
              }
              if (isPhoneField && value.length < 10) {
                return 'Enter valid 10-digit number';
              }
              return null;
            } : null),
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
              prefixIcon: icon is IconData
                  ? Icon(icon, size: icon == HugeIcons.strokeRoundedUserIdVerification ? 16 : 18)
                  : Transform.scale(
                      scale: 0.65,
                      child: HugeIcon(
                          icon: icon,
                          color: Colors.grey[600] ?? Colors.grey,
                          size: 18.0),
                    ),
              suffixIcon: (label.contains('Full Name') || label.contains('Email Address') || label.contains('Verification Phone Number'))
                  ? const Icon(LucideIcons.pencil, size: 18, color: AppTheme.corporateBlue)
                  : null,
              counterText: '',
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
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
                    const Text('Saved PAN Details (Tap to auto-fill):', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
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
                            color: AppTheme.corporateBlue.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.corporateBlue.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.creditCard, size: 16, color: AppTheme.corporateBlue),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${pan.panNumber} - ${pan.name}',
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.deepTeal),
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
