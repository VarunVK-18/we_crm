import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/service_documents.dart';
import '../../providers/auth_provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/constants/port.dart';

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
  
  // Private Limited Incorporation Specific Controllers
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
  String _msmeType = 'Micro';
  String _tradeNature = 'Goods';
  String _markType = 'Word mark';
  bool _tmVerification = false;

  // FSSAI State
  String _fssaiBusinessType = 'Proprietorship';
  String _fssaiTurnover = 'Below ₹12 Lakhs';
  String _fssaiPremisesType = 'Own';
  bool _isCorrespondenceSame = true;
  bool _fssaiDeclaration = false;
  final List<String> _selectedFssaiNatures = [];
  
  final List<String> _fssaiNatureOptions = [
    'Manufacturer', 'Trader', 'Retailer', 'Distributor', 'Wholesaler',
    'Restaurant / Food Service', 'Caterer', 'Importer', 'Exporter',
    'Storage / Warehouse', 'Transporter', 'E-commerce Food Seller', 'Other'
  ];

  // MSME State
  String _msmeOrgSelection = 'Proprietorship';
  String _msmeActivity = 'Services';

  // DUNS State
  String _dunsBusinessType = 'Private Limited';
  
  bool _isPhoneValid = false;
  bool _isCompanyPhoneValid = false;
  
  // Map to store files per document slot
  // Key is the document name from kServiceRequiredDocuments or 'Other Documents'
  final Map<String, List<PlatformFile>> _documentSlots = {};

  // Helper to get all slots (required + general)
  List<String> get _allSlots {
    final docs = kServiceRequiredDocuments[widget.packageName] ?? [];
    return [...docs, 'Other Documents'];
  }

  // Define required documents based on service
  List<String> get _requiredDocs {
    return kServiceRequiredDocuments[widget.packageName] ?? [];
  }

  bool get _areAllRequiredDocsUploaded {
    for (final doc in _requiredDocs) {
      if (!_documentSlots.containsKey(doc) || (_documentSlots[doc]?.isEmpty ?? true)) {
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

    // Initialize Incorporation Controllers
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
      _isCompanyPhoneValid = value.length == 10 && RegExp(r'^[0-9]+$').hasMatch(value);
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Row(
                children: [
                  Icon(LucideIcons.alertTriangle, color: Colors.redAccent),
                  SizedBox(width: 10),
                  Text('File Too Large', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.deepTeal)),
                ],
              ),
              content: const Text(
                'Please upload the file less than 2MB',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('OK', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.corporateBlue)),
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
    super.dispose();
  }

  Future<void> _submitServiceRequest() async {
    final userProfile = ref.read(userProfileProvider).value;
    if (userProfile == null) return;
    
    try {
      final response = await http.post(
        Uri.parse('$kBaseUrl/api/users/profile/${userProfile.id}/subscribe-service'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'serviceName': widget.packageName}),
      );
      if (response.statusCode == 200) {
        debugPrint('Successfully registered service on backend: ${widget.packageName}');
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
      child: SingleChildScrollView(
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
            const SizedBox(height: 24),

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
            
            // Editable Name Field
            _EditableField(
              label: 'Full Name',
              controller: _nameController,
              icon: LucideIcons.user,
              hint: 'Enter your name',
            ),
            const SizedBox(height: 20),

            // Editable Email Field
            _EditableField(
              label: 'Email Address',
              controller: _emailController,
              icon: LucideIcons.mail,
              hint: 'name@example.com',
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 20),

            // Phone Input Field (Editable)
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
            ),
            const SizedBox(height: 24),

            _DetailRow(label: 'Package:', value: widget.packageName),

            ..._buildServiceSpecificForms(),
            
            _buildDocumentSection(),
            
            const SizedBox(height: 12),
            
            _buildNextStepsSection(),

            const SizedBox(height: 40),

            // Action Buttons
            Row(
              children: [
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
                    child: const Text(
                      'Cancel',
                      style: TextStyle(
                        color: AppTheme.deepTeal,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isFormValid
                        ? () async {
                            debugPrint('Submitting request:');
                            debugPrint('Package: ${widget.packageName}');
                            
                            await _submitServiceRequest();
                            
                            if (mounted) {
                              Navigator.pop(context); // Close sheet
                              _showSuccessDialog(context);
                            }
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.corporateBlue,
                      disabledBackgroundColor: Colors.grey[300],
                      foregroundColor: Colors.white,
                      disabledForegroundColor: Colors.grey[500],
                      minimumSize: const Size(0, 56),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      'Submit Request',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        height: 1.1,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
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
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text(
                'Done',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
  bool get _isFormValid {
    if (!_isPhoneValid || !_areAllRequiredDocsUploaded) return false;

    switch (widget.packageName) {
      case 'Private Limited Incorporation':
        return _companyNameController.text.isNotEmpty &&
            _businessActivityController.text.isNotEmpty &&
            _ownerNameController.text.isNotEmpty &&
            _companyEmailController.text.isNotEmpty &&
            _isCompanyPhoneValid &&
            _paidUpCapitalController.text.isNotEmpty &&
            _valuePerShareController.text.isNotEmpty &&
            _noOfSharesController.text.isNotEmpty;
      case 'Trademark Registration':
        return _companyNameController.text.isNotEmpty &&
            _udyamNumberController.text.isNotEmpty &&
            _tmApplicantNameController.text.isNotEmpty &&
            _tmAddressController.text.isNotEmpty &&
            _companyEmailController.text.isNotEmpty &&
            _businessDescController.text.isNotEmpty &&
            _brandUsageDateController.text.isNotEmpty &&
            _tmVerification;
      case 'FSSAI Food License':
        return _nameController.text.isNotEmpty &&
            _phoneController.text.isNotEmpty &&
            _emailController.text.isNotEmpty &&
            _companyNameController.text.isNotEmpty &&
            _selectedFssaiNatures.isNotEmpty &&
            _fssaiStartDateController.text.isNotEmpty &&
            _fssaiEmployeesController.text.isNotEmpty &&
            _fssaiPremisesAddressController.text.isNotEmpty &&
            _fssaiVillageController.text.isNotEmpty &&
            _fssaiDistrictController.text.isNotEmpty &&
            _fssaiDeclaration &&
            (_isCorrespondenceSame ||
                (_fssaiCorrAddressController.text.isNotEmpty &&
                    _fssaiCorrVillageController.text.isNotEmpty &&
                    _fssaiCorrDistrictController.text.isNotEmpty));
      case 'MSME Certification':
        return _companyNameController.text.isNotEmpty &&
            _tmAddressController.text.isNotEmpty &&
            _msmeUnitsController.text.isNotEmpty &&
            _companyPhoneController.text.isNotEmpty &&
            _companyEmailController.text.isNotEmpty &&
            _msmeMaleEmployeesController.text.isNotEmpty &&
            _msmeFemaleEmployeesController.text.isNotEmpty &&
            _msmeIncDateController.text.isNotEmpty &&
            _msmeCommenceDateController.text.isNotEmpty &&
            _msmeGstNumberController.text.isNotEmpty &&
            _msmeInvestmentController.text.isNotEmpty &&
            _msmeTurnoverController.text.isNotEmpty;
      case 'DUNS Number Registration':
        return _companyNameController.text.isNotEmpty &&
            _dunsYearController.text.isNotEmpty &&
            _fssaiEmployeesController.text.isNotEmpty;
      case 'LLP Incorporation':
        return _companyNameController.text.isNotEmpty &&
            _businessActivityController.text.isNotEmpty &&
            _ownerNameController.text.isNotEmpty &&
            _paidUpCapitalController.text.isNotEmpty;
      default:
        return true;
    }
  }

  Widget _buildServiceHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: AppTheme.packageHeaderDecoration([AppTheme.corporateBlue, const Color(0xFF3B5BDB)]),
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
      if (widget.packageName == 'Private Limited Incorporation') ..._buildPrivateLimitedForm(),
      if (widget.packageName == 'Trademark Registration') ..._buildTrademarkForm(),
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
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Proposed Company Name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Eg: Wealth Empires Private Limited',
          isRequired: true),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Nature of Business',
          controller: _businessActivityController,
          icon: LucideIcons.fileText,
          hint: 'Eg: IT Services, Manufacturing, Trading',
          isRequired: true),
      const SizedBox(height: 24),
      _buildSectionHeader('Registered Office Preference'),
      _buildModernRadio('I have my own registered office address', 'Own Address', _officePreference,
          (val) => setState(() => _officePreference = val!)),
      _buildModernRadio('I need Wealth Empires to arrange a virtual office', 'Virtual Office', _officePreference,
          (val) => setState(() => _officePreference = val!)),
      const SizedBox(height: 24),
      _EditableField(
          label: 'Proposed Paid-up Capital (Min ₹1 Lakh)',
          controller: _paidUpCapitalController,
          icon: LucideIcons.indianRupee,
          hint: 'Eg: 1,00,000',
          keyboardType: TextInputType.number,
          isRequired: true),
    ];
  }

  List<Widget> _buildTrademarkForm() {
    return [
      const SizedBox(height: 32),
      Text('Trademark Details',
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
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
      _buildModernRadio<bool>('Yes, we are already using it', true, _isBrandUsed,
          (val) => setState(() => _isBrandUsed = val!)),
      _buildModernRadio<bool>('No, it is a new brand name', false, _isBrandUsed,
          (val) => setState(() => _isBrandUsed = val!)),
      if (_isBrandUsed) ...[
        const SizedBox(height: 20),
        _EditableField(
            label: 'Brand Usage Date',
            controller: _brandUsageDateController,
            icon: LucideIcons.calendar,
            hint: 'DD-MM-YYYY',
            isRequired: true),
      ],
    ];
  }

  List<Widget> _buildMsmeForm() {
    return [
      const SizedBox(height: 32),
      Text('Udyam Registration Details',
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
      const SizedBox(height: 24),
      _buildSectionHeader('Type of organization'),
      ...['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'OPC', 'Trust', 'Society']
          .map((type) => _buildModernRadio(type, type, _msmeOrgSelection, (val) => setState(() => _msmeOrgSelection = val!))),
      const SizedBox(height: 24),
      _buildSectionHeader('Major activity'),
      Row(
        children: [
          Expanded(
              child: _buildModernRadio(
                  'Manufacturing', 'Manufacturing', _msmeActivity, (val) => setState(() => _msmeActivity = val!))),
          Expanded(child: _buildModernRadio('Service', 'Service', _msmeActivity, (val) => setState(() => _msmeActivity = val!))),
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
                  isRequired: true)),
          const SizedBox(width: 16),
          Expanded(
              child: _EditableField(
                  label: 'Commence. Date',
                  controller: _msmeCommenceDateController,
                  icon: LucideIcons.calendarCheck,
                  hint: 'DD/MM/YYYY',
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
          isRequired: true),
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
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
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
      ...['Private Limited', 'LLP', 'Sole Proprietorship', 'Partnership', 'Other']
          .map((type) => _buildModernRadio(type, type, _dunsBusinessType, (val) => setState(() => _dunsBusinessType = val!))),
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
      Text('LLP Details',
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Proposed LLP name',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Wealth Empires LLP',
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
      _buildModernRadio('Do you have address for your company', 'Own Address', _officePreference,
          (val) => setState(() => _officePreference = val!)),
      _buildModernRadio('Do you want virtual office for your company', 'Virtual Office', _officePreference,
          (val) => setState(() => _officePreference = val!)),
      const SizedBox(height: 24),
      _EditableField(
          label: 'Name of the Owner in the utility bill',
          controller: _ownerNameController,
          icon: LucideIcons.user,
          hint: 'As per EB/Wifi bill',
          isRequired: true),
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
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
      const SizedBox(height: 8),
      Text('Enter your business details correctly', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
      const SizedBox(height: 20),
      _EditableField(
          label: 'Name of Business',
          controller: _companyNameController,
          icon: LucideIcons.building,
          hint: 'Registered entity name',
          isRequired: true),
      const SizedBox(height: 20),
      _buildSectionHeader('Type of Business'),
      ...['Proprietorship', 'Partnership', 'LLP', 'Private Limited Company', 'One Person Company', 'Other'].map(
          (type) => _buildModernRadio(type, type, _fssaiBusinessType, (val) => setState(() => _fssaiBusinessType = val!))),
      const SizedBox(height: 24),
      _buildSectionHeader('Nature of Food Business'),
      const Text('(Select all applicable)', style: TextStyle(fontSize: 11, color: Colors.grey)),
      const SizedBox(height: 12),
      ..._fssaiNatureOptions.map((nature) => CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(nature, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
          isRequired: true),
      const SizedBox(height: 20),
      _buildSectionHeader('Expected Annual Turnover'),
      ...['Below ₹12 Lakhs', '₹12 Lakhs – ₹20 Crores', 'Above ₹20 Crores']
          .map((to) => _buildModernRadio(to, to, _fssaiTurnover, (val) => setState(() => _fssaiTurnover = val!))),
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
          Expanded(child: _buildModernRadio('Own', 'Own', _fssaiPremisesType, (val) => setState(() => _fssaiPremisesType = val!))),
          Expanded(child: _buildModernRadio('Rent', 'Rent', _fssaiPremisesType, (val) => setState(() => _fssaiPremisesType = val!))),
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
                  label: 'Village', controller: _fssaiVillageController, icon: LucideIcons.map, hint: 'Town/Village', isRequired: true)),
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
      _buildSectionHeader('Is your correspondence Address same as "Address of Premises"'),
      Row(
        children: [
          Expanded(
              child: _buildModernRadio<bool>('Yes', true, _isCorrespondenceSame, (val) => setState(() => _isCorrespondenceSame = val!))),
          Expanded(
              child: _buildModernRadio<bool>('No', false, _isCorrespondenceSame, (val) => setState(() => _isCorrespondenceSame = val!))),
        ],
      ),
      if (!_isCorrespondenceSame) ...[
        const SizedBox(height: 24),
        Text('Correspondence Address',
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
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
              onChanged: (val) => setState(() => _fssaiDeclaration = val ?? false)),
          Expanded(
              child: Text('I hereby declare that all information provided is true and correct to the best of my knowledge.',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[700]))),
          const Text(' *', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
        ],
      ),
    ];
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Text(title,
            style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.deepTeal.withValues(alpha: 0.6))),
        const Text(' *', style: TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w800)),
      ],
    );
  }

  Widget _buildModernRadio<T>(String title, T value, T groupValue, ValueChanged<T?> onChanged) {
    return RadioListTile<T>(
      contentPadding: EdgeInsets.zero,
      title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
            Text(widget.packageName == 'FSSAI Food License' ? 'Upload Documents * (Max 2MB)' : 'Upload Documents *',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.deepTeal)),
            Text('(Max 2MB/file)', style: TextStyle(fontSize: 11, color: Colors.grey[500], fontWeight: FontWeight.w500)),
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
                    Icon(isOther ? LucideIcons.plusCircle : LucideIcons.fileCheck2,
                        size: 16, color: isOther ? Colors.grey[400]! : AppTheme.corporateBlue),
                    const SizedBox(width: 8),
                    Text(slotName,
                        style: GoogleFonts.outfit(
                            fontSize: 13, fontWeight: FontWeight.w800, color: isOther ? Colors.grey[600] : AppTheme.deepTeal)),
                  ],
                ),
                const SizedBox(height: 12),
                if (files.isNotEmpty)
                  ...files.asMap().entries.map((entry) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                            color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[200]!)),
                        child: Row(
                          children: [
                            Expanded(
                                child: Text(entry.value.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.deepTeal))),
                            IconButton(
                                icon: const Icon(LucideIcons.x, size: 14),
                                color: Colors.red[300],
                                onPressed: () => _removeFile(slotName, entry.key),
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
                        border: Border.all(color: AppTheme.corporateBlue.withValues(alpha: 0.2), style: BorderStyle.solid),
                        borderRadius: BorderRadius.circular(12),
                        color: AppTheme.corporateBlue.withValues(alpha: 0.02)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.uploadCloud, size: 16, color: AppTheme.corporateBlue),
                        const SizedBox(width: 8),
                        Text(files.isEmpty ? 'Upload $slotName' : 'Add More Files',
                            style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.corporateBlue, fontSize: 13)),
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
          border: Border.all(color: AppTheme.corporateBlue.withValues(alpha: 0.1))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.helpCircle, color: AppTheme.corporateBlue, size: 20),
              SizedBox(width: 8),
              Text('What happens next?', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.deepTeal, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 12),
          Text('Your service request will be submitted to our team. We will contact you at this number within 24 hours.',
              style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.5)),
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
      padding: const EdgeInsets.only(bottom: 16),
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
  final IconData icon;
  final String hint;
  final TextInputType keyboardType;
  final int? maxLength;
  final int? maxLines;
  final List<TextInputFormatter>? inputFormatters;
  final bool isPhoneField;
  final bool isPhoneValid;
  final bool isRequired;

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
    this.isRequired = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: isPhoneField ? AppTheme.corporateBlue : AppTheme.deepTeal.withValues(alpha: 0.6),
                letterSpacing: 0.5,
              ),
            ),
            if (isRequired)
              const Text(' *', style: TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.w800)),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isPhoneField && isPhoneValid
                  ? AppTheme.corporateBlue.withValues(alpha: 0.2)
                  : Colors.transparent,
            ),
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            maxLength: maxLength,
            maxLines: maxLines,
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
              prefixIcon: Icon(icon, size: 18),
              counterText: '',
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ],
    );
  }
}
