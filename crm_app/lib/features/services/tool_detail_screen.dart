import 'package:crm_app/core/utils/error_handler.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/tm_classes.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import 'dart:convert';
import '../../core/constants/port.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../core/widgets/we_loader.dart';

class ToolDetailScreen extends ConsumerStatefulWidget {
  final String toolName;
  final dynamic icon;

  const ToolDetailScreen({
    super.key,
    required this.toolName,
    required this.icon,
  });

  @override
  ConsumerState<ToolDetailScreen> createState() => _ToolDetailScreenState();
}

class _ToolDetailScreenState extends ConsumerState<ToolDetailScreen> {
  // Input Controllers
  final _amountController = TextEditingController();
  final _rateController = TextEditingController();
  final _durationController = TextEditingController();
  final _searchController = TextEditingController();

  // Calculation Results
  double _primaryResult = 0.0;
  final double _secondaryResult = 0.0;
  String _detailMessage = '';

  // GST Calculator Variables
  final ValueNotifier<String> _selectedGstRate = ValueNotifier<String>('18%');
  final ValueNotifier<String> _selectedTaxType = ValueNotifier<String>('Exclusive');
  double _actualAmount = 0.0;
  double _gstAmount = 0.0;
  double _totalAmount = 0.0;

  // TDS Calculator Variables
  final ValueNotifier<String> _selectedTdsCalcType = ValueNotifier<String>('Interest On Late Deduction');
  DateTime? _tdsDate1;
  DateTime? _tdsDate2;

  // NIC Finder - hierarchical data
  bool _isLoadingNic = false;
  List<Map<String, dynamic>> _nicFlat = []; // flat list for search
  final TextEditingController _nicSearchController = TextEditingController();
  String _nicSearchQuery = '';
  List<Map<String, dynamic>> _nicSearchResults = [];

  // NIC Finder - cascading selections
  List<Map<String, dynamic>> _nicDivisions = [];
  List<Map<String, dynamic>> _nicGroups = [];
  List<Map<String, dynamic>> _nicClasses = [];
  List<Map<String, dynamic>> _nicSubClasses = [];

  Map<String, dynamic>? _selectedDivision;
  Map<String, dynamic>? _selectedGroup;
  Map<String, dynamic>? _selectedClass;
  Map<String, dynamic>? _selectedSubClass;

  List<TmClass> _allTmClasses = [];
  List<TmClass> _filteredTmClasses = [];
  bool _isLoadingTm = false;

  List<dynamic> _allComplianceEvents = [];
  List<dynamic> _filteredComplianceEvents = [];
  String _calendarYear = '';
  bool _isLoadingCompliance = false;

  Timer? _debounce;

  final FocusNode _amountFocus = FocusNode();
  final FocusNode _rateFocus = FocusNode();
  final FocusNode _durationFocus = FocusNode();
  TextEditingController? _focusedController;

  final ScrollController _scrollController = ScrollController();
  bool _showBackToTopButton = false;

  @override
  void initState() {
    super.initState();
    _amountFocus.addListener(() {
      if (_amountFocus.hasFocus) setState(() => _focusedController = _amountController);
    });
    _rateFocus.addListener(() {
      if (_rateFocus.hasFocus) setState(() => _focusedController = _rateController);
    });
    _durationFocus.addListener(() {
      if (_durationFocus.hasFocus) setState(() => _focusedController = _durationController);
    });
    _focusedController = _amountController;
    _initializeDefaults();
    if (widget.toolName == 'NIC Finder') {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _loadNicData();
      });
    } else if (widget.toolName == 'Trade Mark Class') {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _loadTmData();
      });
    } else if (widget.toolName == 'Compliance Calendar') {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _loadComplianceData();
      });
    }

    _scrollController.addListener(() {
      if (_scrollController.offset >= 400 && !_showBackToTopButton) {
        setState(() => _showBackToTopButton = true);
      } else if (_scrollController.offset < 400 && _showBackToTopButton) {
        setState(() => _showBackToTopButton = false);
      }
    });
  }

  Future<void> _loadTmData() async {
    setState(() => _isLoadingTm = true);
    final classes = await TmClassService.loadTmClasses();
    setState(() {
      _allTmClasses = classes;
      _filteredTmClasses = classes;
      _isLoadingTm = false;
    });
  }

  Future<void> _loadNicData() async {
    setState(() => _isLoadingNic = true);
    try {
      final String raw = await DefaultAssetBundle.of(context).loadString('assets/json/NIC_2008_classification.json');
      final parsed = json.decode(raw) as Map<String, dynamic>;
      final sections = (parsed['NIC_2008']?['sections'] as List?) ?? [];
      final List<Map<String, dynamic>> divisions = [];
      final List<Map<String, dynamic>> flat = [];
      for (final section in sections) {
        for (final div in (section['divisions'] as List? ?? [])) {
          final divMap = {
            'division': div['division'],
            'title': div['title'],
            'groups': div['groups'] ?? [],
          };
          divisions.add(divMap);
          // build flat list for search
          for (final g in (div['groups'] as List? ?? [])) {
            flat.add({
              'code': g['code'],
              'description': g['description'] ?? '',
              'level': 'Group',
              'divCode': div['division'],
              'divTitle': div['title'],
            });
            for (final c in (g['classes'] as List? ?? [])) {
              flat.add({
                'code': c['code'],
                'description': c['description'] ?? '',
                'level': 'Class',
                'divCode': div['division'],
                'divTitle': div['title'],
                'groupCode': g['code'],
              });
              for (final s in (c['sub_classes'] as List? ?? [])) {
                flat.add({
                  'code': s['code'],
                  'description': s['description'] ?? '',
                  'level': 'Sub-class',
                  'divCode': div['division'],
                  'divTitle': div['title'],
                  'groupCode': g['code'],
                  'classCode': c['code'],
                });
              }
            }
          }
        }
      }
      // Sort divisions numerically
      divisions.sort((a, b) {
        final aNum = int.tryParse(a['division'] ?? '') ?? 0;
        final bNum = int.tryParse(b['division'] ?? '') ?? 0;
        return aNum.compareTo(bNum);
      });
      setState(() {
        _nicDivisions = divisions;
        _nicFlat = flat;
        _isLoadingNic = false;
      });
    } catch (e) {
      setState(() => _isLoadingNic = false);
      debugPrint('NIC load error: $e');
    }
  }

  void _onDivisionSelected(Map<String, dynamic>? div) {
    setState(() {
      _selectedDivision = div;
      _nicGroups = div != null ? List<Map<String, dynamic>>.from(div['groups'] as List) : [];
      _selectedGroup = null;
      _nicClasses = [];
      _selectedClass = null;
      _nicSubClasses = [];
      _selectedSubClass = null;
    });
  }

  void _onGroupSelected(Map<String, dynamic>? group) {
    setState(() {
      _selectedGroup = group;
      _nicClasses = group != null ? List<Map<String, dynamic>>.from(group['classes'] as List? ?? []) : [];
      _selectedClass = null;
      _nicSubClasses = [];
      _selectedSubClass = null;
    });
  }

  void _onClassSelected(Map<String, dynamic>? cls) {
    setState(() {
      _selectedClass = cls;
      _nicSubClasses = cls != null ? List<Map<String, dynamic>>.from(cls['sub_classes'] as List? ?? []) : [];
      _selectedSubClass = null;
    });
  }

  Future<void> _loadComplianceData() async {
    setState(() => _isLoadingCompliance = true);
    try {
      final authState = ref.read(authStateProvider).value;
      final uid = authState?.uid ?? '';
      final response = await http.get(
        Uri.parse('$kBaseUrl/api/calendar/latest'),
        headers: {'x-user-id': uid},
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['calendar'] != null) {
          setState(() {
            _calendarYear = data['calendar']['year'] ?? '';
            _allComplianceEvents = data['calendar']['events'] ?? [];
            _filteredComplianceEvents = List.from(_allComplianceEvents);
          });
        }
      }
    } catch (e) {
      showGlobalError(e);
      debugPrint('Error loading compliance data: $e');
    }
    setState(() => _isLoadingCompliance = false);
  }

  void _initializeDefaults() {
    if (widget.toolName == 'GST Calculator') {
      _rateController.text = '18';
    } else if (widget.toolName == 'GST Interest') {
      _rateController.text = '18';
      _durationController.text = '30';
    } else if (widget.toolName == 'TDS Interest') {
      _rateController.text = '1.5';
      _durationController.text = '1';
    }
  }

  void _calculate() {
    final amount = double.tryParse(_amountController.text) ?? 0.0;
    final rate = double.tryParse(_rateController.text) ?? 0.0;
    final duration = double.tryParse(_durationController.text) ?? 0.0;

    setState(() {
      if (widget.toolName.contains('GST Calc')) {
        final amount = double.tryParse(_amountController.text) ?? 0.0;
        final rate = double.tryParse(_selectedGstRate.value.replaceAll('%', '')) ?? 0.0;
        
        if (_selectedTaxType.value == 'Exclusive') {
          _actualAmount = amount;
          _gstAmount = (amount * rate) / 100;
          _totalAmount = _actualAmount + _gstAmount;
        } else {
          _totalAmount = amount;
          _gstAmount = amount - (amount * (100 / (100 + rate)));
          _actualAmount = amount - _gstAmount;
        }
      } else if (widget.toolName == 'GST Interest') {
        _primaryResult = (amount * (rate / 100) / 365) * duration;
        _detailMessage = 'Interest calculated at $rate% p.a. for ${duration.toStringAsFixed(0)} days';
      } else if (widget.toolName == 'TDS Interest') {
        final amount = double.tryParse(_amountController.text) ?? 0.0;
        double calculatedInterest = 0.0;
        int monthsDelay = 0;

        if (_tdsDate1 != null && _tdsDate2 != null) {
          int daysDelay = _tdsDate2!.difference(_tdsDate1!).inDays;
          if (daysDelay > 0) {
            monthsDelay = (daysDelay / 30).ceil();
          }
        }

        if (_selectedTdsCalcType.value == 'Interest On Late Deduction') {
          calculatedInterest = amount * 0.01 * monthsDelay;
          _detailMessage = '1% p.m. from Date of Payment to Date of Deduction';
        } else if (_selectedTdsCalcType.value == 'Interest On Late Payment') {
          calculatedInterest = amount * 0.015 * monthsDelay;
          _detailMessage = '1.5% p.m. from Date of Deduction to Date of Payment';
        } else {
          int daysDelay = 0;
          if (_tdsDate1 != null && _tdsDate2 != null) {
            daysDelay = _tdsDate2!.difference(_tdsDate1!).inDays;
            if (daysDelay < 0) daysDelay = 0;
          }
          calculatedInterest = (200 * daysDelay).toDouble();
          if (calculatedInterest > amount) calculatedInterest = amount; 
          _detailMessage = '₹200 per day for $daysDelay days (Max: Tax Amount)';
        }

        _primaryResult = calculatedInterest;
      }
    });
  }



  void _searchCompliance(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() {
          if (query.isEmpty) {
            _filteredComplianceEvents = List.from(_allComplianceEvents);
          } else {
            final lowercaseQuery = query.toLowerCase();
            _filteredComplianceEvents = _allComplianceEvents.where((event) {
              final title = (event['title'] ?? '').toString().toLowerCase();
              final category = (event['category'] ?? '').toString().toLowerCase();
              final date = (event['dueDate'] ?? '').toString().toLowerCase();
              final forms = (event['formsOrSections'] ?? '').toString().toLowerCase();
              return title.contains(lowercaseQuery) ||
                  category.contains(lowercaseQuery) ||
                  date.contains(lowercaseQuery) ||
                  forms.contains(lowercaseQuery);
            }).toList();
          }
        });
      }
    });
  }

  void _searchTmClass(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      setState(() {
        if (query.isEmpty) {
          _filteredTmClasses = _allTmClasses;
        } else {
          _filteredTmClasses = _allTmClasses
              .where((item) =>
                  item.classNum.toString().contains(query) ||
                  item.description.toLowerCase().contains(query.toLowerCase()) ||
                  item.type.toLowerCase().contains(query.toLowerCase()))
              .toList();
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.deepTeal),
          onPressed: () => Navigator.pop(context),
        ),
        title: Padding(
          padding: const EdgeInsets.only(left: 12, top: 12),
          child: Text(
            widget.toolName,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.deepTeal,
            ),
          ),
        ),
      ),
      floatingActionButton: _showBackToTopButton
          ? FloatingActionButton(
              shape: const CircleBorder(),
              onPressed: () {
                _scrollController.animateTo(
                  0,
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeInOut,
                );
              },
              backgroundColor: Colors.black,
              child: const Icon(LucideIcons.arrowUp, color: Colors.white),
            )
          : null,
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.toolName != 'NIC Finder' && 
                      widget.toolName != 'Trade Mark Class' &&
                      widget.toolName != 'TDS Interest' && 
                      widget.toolName != 'Compliance Calendar' &&
                      !widget.toolName.contains('GST')) ...[
                    _buildHeaderWidget(),
                    const SizedBox(height: 32),
                  ],
                  _buildToolContent(),
                  if (widget.toolName != 'NIC Finder' && widget.toolName != 'Trade Mark Class' && widget.toolName != 'Compliance Calendar' && !widget.toolName.contains('GST Calc')) ...[
                    const SizedBox(height: 32),
                    _buildResultCard(),
                  ],
                ],
              ),
            ),
          ),
          if (widget.toolName != 'NIC Finder' && widget.toolName != 'Trade Mark Class' && widget.toolName != 'TDS Interest' && widget.toolName != 'Compliance Calendar') _buildNumpad(),
        ],
      ),
    );
  }

  Widget _buildHeaderWidget() {
    if (widget.toolName == 'NIC Finder' || widget.toolName == 'Trade Mark Class') {
      return const SizedBox.shrink();
    }
    
    return Center(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.corporateBlue.withOpacity(0.05),
              borderRadius: BorderRadius.circular(32),
            ),
            child: widget.icon is IconData
                ? Icon(widget.icon as IconData,
                    size: 48, color: AppTheme.corporateBlue)
                : HugeIcon(
                    icon: widget.icon, size: 48, color: AppTheme.corporateBlue),
          ),
          const SizedBox(height: 16),
          Text(
            _getToolDescription(),
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: Colors.grey[500],
              height: 1.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _getToolDescription() {
    switch (widget.toolName) {
      case 'GST Calculator':
      case 'GST Calc':
        return 'Calculate Goods and Services Tax quickly with custom rates.';
      case 'GST Interest':
        return 'Determine interest liability for late GST payments (18% p.a.).';
      case 'TDS Interest':
        return 'Calculate interest for late TDS deposits (1.5% p.m.).';
      case 'NIC Finder':
        return 'Search for the appropriate National Industrial Classification code.';
      case 'Trade Mark Class':
        return 'Search for the appropriate Trade Mark class for goods and services.';
      case 'Compliance Calendar':
        return 'View upcoming compliance deadlines, forms, and descriptions.';
      default:
        return 'Professional utility for business compliance management.';
    }
  }

  Widget _buildToolContent() {
    if (widget.toolName == 'NIC Finder') {
      return _buildNICFinder();
    }
    if (widget.toolName == 'Trade Mark Class') {
      return _buildTradeMarkClassFinder();
    }
    if (widget.toolName == 'Compliance Calendar') {
      return _buildComplianceCalendar();
    }
    if (widget.toolName.contains('GST Calc')) {
      return _buildGstCalculator();
    }
    if (widget.toolName == 'TDS Interest') {
      return _buildTdsCalculator();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputLabel('Amount (₹)'),
        _buildTextField(_amountController, 'e.g. 10000', LucideIcons.indianRupee, focusNode: _amountFocus),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInputLabel(widget.toolName == 'GST Calculator' ? 'Rate (%)' : 'Rate (%) p.a.'),
                  _buildTextField(_rateController, 'e.g. 18', LucideIcons.percent, focusNode: _rateFocus),
                ],
              ),
            ),
            const SizedBox(width: 16),
            if (widget.toolName != 'GST Calculator')
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInputLabel(widget.toolName == 'TDS Interest' ? 'Months' : 'Days'),
                    _buildTextField(_durationController, 'Duration', LucideIcons.clock, focusNode: _durationFocus),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildInputLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 10),
      child: Text(
        label,
        style: GoogleFonts.outfit(
          fontWeight: FontWeight.w700,
          fontSize: 14,
          color: AppTheme.deepTeal,
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon, {FocusNode? focusNode}) {
    bool isReadOnly = widget.toolName != 'NIC Finder' && widget.toolName != 'Trade Mark Class' && widget.toolName != 'TDS Interest';
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        readOnly: isReadOnly,
        showCursor: isReadOnly,
        keyboardType: isReadOnly ? TextInputType.none : TextInputType.number,
        onChanged: (_) => _calculate(),
        style: GoogleFonts.outfit(
          fontWeight: FontWeight.w600,
          color: AppTheme.deepTeal,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.outfit(
            color: Colors.grey[400],
            fontWeight: FontWeight.w400,
          ),
          prefixIcon: Container(
            margin: const EdgeInsets.all(4),
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.grey[600], size: 18),
          ),
          isDense: true,
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildDatePicker(String label, DateTime? selectedDate, ValueChanged<DateTime> onDateSelected) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInputLabel(label),
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: selectedDate ?? DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
            );
            if (date != null) {
              onDateSelected(date);
            }
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  selectedDate != null
                      ? '${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.year}'
                      : 'dd/mm/yyyy',
                  style: GoogleFonts.outfit(
                    color: selectedDate != null ? AppTheme.deepTeal : Colors.grey[400],
                    fontWeight: selectedDate != null ? FontWeight.w600 : FontWeight.w400,
                    fontSize: 15,
                  ),
                ),
                Icon(LucideIcons.calendar, size: 20, color: Colors.grey[600]),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTdsCalculator() {
    return ValueListenableBuilder<String>(
      valueListenable: _selectedTdsCalcType,
      builder: (context, calcType, _) {
        String date1Label = 'Date Of Amount Payment';
        String date2Label = 'Date Of Tax Deduction';
        if (calcType == 'Interest On Late Payment') {
          date1Label = 'Date Of Tax Deduction';
          date2Label = 'Date Of Tax Payment';
        } else if (calcType == 'Interest On Late Filing') {
          date1Label = 'Due Date Of Filing';
          date2Label = 'Actual Date Of Filing';
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
              _buildInputLabel('Enter Amount Of Tax Deducted'),
              _buildTextField(_amountController, 'e.g. 100000', LucideIcons.indianRupee, focusNode: _amountFocus),
              const SizedBox(height: 20),
              _buildInputLabel('Type Of Interest Calculation'),
              _buildDropdown(
                valueListenable: _selectedTdsCalcType,
                items: [
                  'Interest On Late Deduction',
                  'Interest On Late Payment',
                  'Interest On Late Filing'
                ],
                onChanged: (val) {
                  _selectedTdsCalcType.value = val!;
                  _calculate();
                },
              ),
              const SizedBox(height: 20),
              _buildDatePicker(date1Label, _tdsDate1, (date) {
                setState(() => _tdsDate1 = date);
                _calculate();
              }),
              const SizedBox(height: 20),
              _buildDatePicker(date2Label, _tdsDate2, (date) {
                setState(() => _tdsDate2 = date);
                _calculate();
              }),
            ],
        );
      },
    );
  }

  Widget _buildNICFinder() {
    if (_isLoadingNic) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40.0),
          child: WeLoader(),
        ),
      );
    }

    void doSearch(String q) {
      setState(() {
        _nicSearchQuery = q;
        if (q.isEmpty) {
          _nicSearchResults = [];
        } else {
          final lq = q.toLowerCase();
          _nicSearchResults = _nicFlat.where((item) {
            return (item['code'] as String).toLowerCase().contains(lq) ||
                   (item['description'] as String).toLowerCase().contains(lq);
          }).take(60).toList();
        }
      });
    }

    Widget nicTile({
      required String label,
      required String hint,
      required Map<String, dynamic>? value,
      required String Function(Map<String, dynamic>) getLabel,
      required String Function(Map<String, dynamic>) getCode,
      required List<Map<String, dynamic>> items,
      required void Function(Map<String, dynamic>) onSelected,
      bool enabled = true,
    }) {
      final displayText = value != null ? getLabel(value) : null;
      final codeText = value != null ? getCode(value) : null;
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.deepTeal)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: enabled
                ? () async {
                    final sheetCtrl = TextEditingController();
                    List<Map<String, dynamic>> sheetFiltered = List.from(items);
                    await showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => StatefulBuilder(
                        builder: (ctx, setModal) => Container(
                          height: MediaQuery.of(context).size.height * 0.75,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                          ),
                          child: Column(
                            children: [
                              const SizedBox(height: 12),
                              Container(width: 40, height: 4,
                                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                              const SizedBox(height: 14),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text('Select $label', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.deepTeal)),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Container(
                                  decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.grey[200]!)),
                                  child: TextField(
                                    controller: sheetCtrl,
                                    autofocus: true,
                                    style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.deepTeal),
                                    decoration: InputDecoration(
                                      hintText: 'Search...',
                                      hintStyle: GoogleFonts.outfit(color: Colors.grey[400], fontSize: 14),
                                      prefixIcon: Icon(LucideIcons.search, size: 18, color: Colors.grey[400]),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                    ),
                                    onChanged: (q) {
                                      setModal(() {
                                        final lq = q.toLowerCase();
                                        sheetFiltered = q.isEmpty ? List.from(items)
                                            : items.where((it) => getCode(it).toLowerCase().contains(lq) || getLabel(it).toLowerCase().contains(lq)).toList();
                                      });
                                    },
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Divider(height: 1),
                              Expanded(
                                child: sheetFiltered.isEmpty
                                    ? Center(child: Text('No results', style: GoogleFonts.outfit(color: Colors.grey[400])))
                                    : ListView.separated(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        itemCount: sheetFiltered.length,
                                        separatorBuilder: (_, __) => const Divider(height: 1, indent: 16, endIndent: 16),
                                        itemBuilder: (_, i) {
                                          final item = sheetFiltered[i];
                                          return InkWell(
                                            onTap: () { Navigator.pop(ctx); onSelected(item); },
                                            child: Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                              child: Row(
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                    decoration: BoxDecoration(color: AppTheme.deepTeal, borderRadius: BorderRadius.circular(6)),
                                                    child: Text(getCode(item), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  Expanded(child: Text(getLabel(item),
                                                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.deepTeal),
                                                    maxLines: 2, overflow: TextOverflow.ellipsis)),
                                                  Icon(LucideIcons.chevronRight, size: 16, color: Colors.grey[400]),
                                                ],
                                              ),
                                            ),
                                          );
                                        },
                                      ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                    Future.microtask(() => sheetCtrl.dispose());
                  }
                : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              decoration: BoxDecoration(
                color: enabled ? Colors.white : Colors.grey[50],
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: enabled ? AppTheme.corporateBlue.withOpacity(0.3) : Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  if (codeText != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppTheme.deepTeal, borderRadius: BorderRadius.circular(6)),
                      child: Text(codeText, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(child: Text(displayText ?? hint,
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: displayText != null ? FontWeight.w500 : FontWeight.w400,
                      color: displayText != null ? AppTheme.deepTeal : Colors.grey[400]),
                    overflow: TextOverflow.ellipsis, maxLines: 1)),
                  const SizedBox(width: 8),
                  Icon(LucideIcons.chevronDown, size: 18, color: enabled ? AppTheme.corporateBlue : Colors.grey[300]),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Visible search bar ──
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: TextField(
            controller: _nicSearchController,
            style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.deepTeal),
            decoration: InputDecoration(
              hintText: 'Search NIC code or description...',
              hintStyle: GoogleFonts.outfit(color: Colors.grey[400], fontSize: 14),
              prefixIcon: Icon(LucideIcons.search, size: 18, color: Colors.grey[400]),
              suffixIcon: _nicSearchQuery.isNotEmpty
                  ? IconButton(
                      icon: Icon(LucideIcons.x, size: 16, color: Colors.grey[400]),
                      onPressed: () { _nicSearchController.clear(); doSearch(''); },
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            onChanged: doSearch,
          ),
        ),
        const SizedBox(height: 16),
        if (_nicSearchQuery.isNotEmpty) ...[
          if (_nicSearchResults.isEmpty)
            Center(child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text('No results found', style: GoogleFonts.outfit(color: Colors.grey[400], fontSize: 14)),
            ))
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _nicSearchResults.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final item = _nicSearchResults[i];
                final code = item['code'] as String;
                final desc = item['description'] as String;
                final level = item['level'] as String;
                final divCode = item['divCode'] as String? ?? '';
                final divTitle = item['divTitle'] as String? ?? '';
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppTheme.deepTeal, borderRadius: BorderRadius.circular(6)),
                    child: Text(code, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                  title: _ExpandableDescription(
                    text: desc,
                    trimLines: 2,
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.deepTeal),
                  ),
                  subtitle: Text('$level · Division $divCode – $divTitle',
                    style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey[500])),
                );
              },
            ),
        ] else ...[
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.grey[200]!),
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _nicDivisions.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey[200]),
              itemBuilder: (context, dIndex) {
                final div = _nicDivisions[dIndex];
                final divCode = div['division'] ?? '';
                final divTitle = div['title'] ?? '';
                final groups = div['groups'] as List? ?? [];
                
                return Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    leading: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Div $divCode',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    title: _ExpandableDescription(
                      text: divTitle,
                      trimLines: 2,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppTheme.deepTeal,
                      ),
                    ),
                    children: groups.map<Widget>((g) {
                      final gCode = g['code'] ?? '';
                      final gDesc = g['description'] ?? '';
                      final classes = g['classes'] as List? ?? [];
                      
                      return ExpansionTile(
                        tilePadding: const EdgeInsets.only(left: 20, right: 14, top: 2, bottom: 2),
                        leading: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.deepTeal.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            gCode,
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.deepTeal,
                            ),
                          ),
                        ),
                        title: _ExpandableDescription(
                          text: gDesc,
                          trimLines: 2,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w500,
                            fontSize: 13,
                            color: AppTheme.deepTeal,
                          ),
                        ),
                        children: classes.map<Widget>((c) {
                          final cCode = c['code'] ?? '';
                          final cDesc = c['description'] ?? '';
                          final subClasses = c['sub_classes'] as List? ?? [];
                          
                          if (subClasses.isEmpty) {
                            return ListTile(
                              contentPadding: const EdgeInsets.only(left: 36, right: 14),
                              leading: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.indigo.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  cCode,
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.indigo[800],
                                  ),
                                ),
                              ),
                              title: _ExpandableDescription(
                                text: cDesc,
                                trimLines: 2,
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: AppTheme.deepTeal,
                                ),
                              ),
                              onTap: () {
                                setState(() {
                                  _selectedDivision = div;
                                  _selectedGroup = g;
                                  _selectedClass = c;
                                  _selectedSubClass = null;
                                });
                              },
                            );
                          }
                          
                          return ExpansionTile(
                            tilePadding: const EdgeInsets.only(left: 36, right: 14, top: 2, bottom: 2),
                            leading: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.indigo.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                cCode,
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.indigo[800],
                                ),
                              ),
                            ),
                            title: _ExpandableDescription(
                              text: cDesc,
                              trimLines: 2,
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w500,
                                fontSize: 12,
                                color: AppTheme.deepTeal,
                              ),
                            ),
                            children: subClasses.map<Widget>((s) {
                              final sCode = s['code'] ?? '';
                              final sDesc = s['description'] ?? '';
                              return ListTile(
                                contentPadding: const EdgeInsets.only(left: 52, right: 14),
                                leading: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.teal.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    sCode,
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.teal[900],
                                    ),
                                  ),
                                ),
                                title: _ExpandableDescription(
                                  text: sDesc,
                                  trimLines: 2,
                                  style: GoogleFonts.outfit(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w400,
                                    color: Colors.grey[800],
                                  ),
                                ),
                                trailing: const Icon(LucideIcons.checkCircle2, size: 16, color: Colors.grey),
                                onTap: () {
                                  setState(() {
                                    _selectedDivision = div;
                                    _selectedGroup = g;
                                    _selectedClass = c;
                                    _selectedSubClass = s;
                                  });
                                },
                              );
                            }).toList(),
                          );
                        }).toList(),
                      );
                    }).toList(),
                  ),
                );
              },
            ),
          ),
          if (_selectedClass != null || _selectedSubClass != null) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.corporateBlue.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    const Icon(LucideIcons.tag, size: 16, color: AppTheme.corporateBlue),
                    const SizedBox(width: 8),
                    Text('Selected NIC Code', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.corporateBlue)),
                  ]),
                  const SizedBox(height: 12),
                  if (_selectedSubClass != null) _nicResultRow('Sub-class', _selectedSubClass!['code'], _selectedSubClass!['description']),
                  if (_selectedClass != null) _nicResultRow('Class', _selectedClass!['code'], _selectedClass!['description']),
                  if (_selectedGroup != null) _nicResultRow('Group', _selectedGroup!['code'], _selectedGroup!['description']),
                  if (_selectedDivision != null) _nicResultRow('Division', _selectedDivision!['division'], _selectedDivision!['title']),
                ],
              ),
            ),
          ],
        ],
      ],
    );
  }

  Widget _nicResultRow(String level, String code, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.deepTeal,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              code,
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  level,
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[500],
                    letterSpacing: 0.5,
                  ),
                ),
                _ExpandableDescription(
                  text: desc,
                  trimLines: 3,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.deepTeal,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComplianceCalendar() {
    if (_isLoadingCompliance) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40.0),
          child: WeLoader(),
        ),
      );
    }

    if (_allComplianceEvents.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: Text(
            'Compliance Calendar is not uploaded yet.',
            style: GoogleFonts.outfit(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_calendarYear.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Text(
              'Year: $_calendarYear',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepTeal,
              ),
            ),
          ),
        Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _searchCompliance,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w500,
                    color: AppTheme.deepTeal,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Search by title, category, or date...',
                    hintStyle: GoogleFonts.outfit(color: Colors.grey[400]),
                    prefixIcon: Icon(LucideIcons.search, size: 20, color: Colors.grey[400]),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredComplianceEvents.length,
          itemBuilder: (context, index) {
            final event = _filteredComplianceEvents[index];
            final category = (event['category'] ?? '').toString();
            final dueDate = (event['dueDate'] ?? '').toString();
            final title = (event['title'] ?? '').toString();
            final description = (event['description'] ?? '').toString();
            final forms = (event['formsOrSections'] ?? '').toString();
            final applicable = (event['applicableTo'] ?? '').toString();
            
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              dueDate,
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.corporateBlue,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.corporateBlue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              category,
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.corporateBlue,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.deepTeal,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            description,
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              fontWeight: FontWeight.w400,
                              color: Colors.grey[700],
                              height: 1.4,
                            ),
                          ),
                          if (forms.isNotEmpty || applicable.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            if (forms.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 4.0),
                                child: Text(
                                  'Form: $forms',
                                  style: GoogleFonts.outfit(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey[800],
                                  ),
                                ),
                              ),
                            if (applicable.isNotEmpty)
                              Text(
                                'For: $applicable',
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildTradeMarkClassFinder() {
    if (_isLoadingTm) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40.0),
          child: WeLoader(),
        ),
      );
    }

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: _searchTmClass,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w500,
              color: AppTheme.deepTeal,
            ),
            decoration: InputDecoration(
              hintText: 'Search by class number, description, or type...',
              hintStyle: GoogleFonts.outfit(color: Colors.grey[400]),
              prefixIcon: Icon(LucideIcons.search, size: 20, color: Colors.grey[400]),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ),
        const SizedBox(height: 24),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredTmClasses.length,
          itemBuilder: (context, index) {
            final item = _filteredTmClasses[index];
            
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 75,
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Class ${item.classNum}',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        fontSize: 13,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.type.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                            color: AppTheme.corporateBlue.withOpacity(0.8),
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        _ExpandableDescription(text: item.description),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildResultCard() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.deepTeal, AppTheme.deepTeal.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppTheme.deepTeal.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.toolName == 'GST Calculator' ? 'Total Payable' : 'Interest Amount',
                style: GoogleFonts.outfit(
                  color: Colors.white.withOpacity(0.7),
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'FINAL',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '₹${_formatAmount(_primaryResult)}',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 40,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _detailMessage,
            style: GoogleFonts.outfit(
              color: Colors.white.withOpacity(0.5),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGstCalculator() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
          _buildInputLabel('Amount'),
          _buildTextField(_amountController, 'e.g. 10000', LucideIcons.indianRupee, focusNode: _amountFocus),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInputLabel('GST %'),
                    _buildDropdown(
                      valueListenable: _selectedGstRate,
                      items: ['0%', '5%', '12%', '18%', '28%'],
                      onChanged: (val) {
                        _selectedGstRate.value = val!;
                        _calculate();
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInputLabel('Tax'),
                    _buildDropdown(
                      valueListenable: _selectedTaxType,
                      items: ['Exclusive', 'Inclusive'],
                      onChanged: (val) {
                        _selectedTaxType.value = val!;
                        _calculate();
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildOutputColumn('₹${_formatAmount(_actualAmount)}', 'Actual Amount', Colors.blue.shade700),
                Text('+', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade400)),
                _buildOutputColumn('₹${_formatAmount(_gstAmount)}', 'GST Amount', Colors.green),
                Text('=', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade400)),
                _buildOutputColumn('₹${_formatAmount(_totalAmount)}', 'Total Amount', Colors.blue.shade700),
              ],
            ),
          ),
        ],
      );
  }

  Widget _buildDropdown({
    required ValueNotifier<String> valueListenable,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: valueListenable.value,
          icon: const Icon(LucideIcons.chevronDown, size: 20, color: Colors.grey),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
          items: items.map((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  String _formatAmount(double value) {
    if (value == value.toInt()) return value.toInt().toString();
    String str = value.toStringAsFixed(2);
    if (str.endsWith('0')) str = str.substring(0, str.length - 1);
    if (str.endsWith('0')) str = str.substring(0, str.length - 1);
    if (str.endsWith('.')) str = str.substring(0, str.length - 1);
    return str;
  }

  Widget _buildOutputColumn(String amount, String label, Color color) {
    return Expanded(
      child: Column(
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              amount,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.deepTeal,
                letterSpacing: -0.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  void _onNumpadPress(String value) {
    _focusedController ??= _amountController;
    
    if (value == 'clear') {
      _focusedController!.clear();
    } else if (value == 'backspace') {
      if (_focusedController!.text.isNotEmpty) {
        _focusedController!.text = _focusedController!.text.substring(0, _focusedController!.text.length - 1);
      }
    } else {
      _focusedController!.text += value;
    }
    _calculate();
  }

  Widget _buildNumpad() {
    final keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['.', '0', 'backspace'],
    ];

    return Container(
      padding: const EdgeInsets.only(left: 12, right: 12, bottom: 16, top: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: keys.map((row) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: row.map((key) {
                if (key == 'backspace') {
                  return _buildNumpadButton(
                    icon: LucideIcons.delete,
                    onTap: () => _onNumpadPress('backspace'),
                    onLongPress: () => _onNumpadPress('clear'),
                  );
                }
                return _buildNumpadButton(
                  label: key,
                  onTap: () => _onNumpadPress(key),
                );
              }).toList(),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildNumpadButton({String? label, IconData? icon, VoidCallback? onTap, VoidCallback? onLongPress}) {
    return Expanded(
      child: Center(
        child: Material(
          color: const Color(0xFF312E81),
          shape: const CircleBorder(),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            onLongPress: onLongPress,
            customBorder: const CircleBorder(),
            child: SizedBox(
              width: 65,
              height: 65,
              child: Center(
                child: label != null
                    ? Text(
                      label,
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    )
                  : Icon(icon, color: Colors.white, size: 22),
            ),
          ),
        ),
      ),
    ));
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _amountFocus.dispose();
    _rateFocus.dispose();
    _durationFocus.dispose();
    _debounce?.cancel();
    _amountController.dispose();
    _rateController.dispose();
    _durationController.dispose();
    _searchController.dispose();
    _selectedGstRate.dispose();
    _selectedTaxType.dispose();
    _selectedTdsCalcType.dispose();
    super.dispose();
  }
}

class _ExpandableDescription extends StatefulWidget {
  final String text;
  final TextStyle? style;
  final int trimLines;

  const _ExpandableDescription({
    super.key,
    required this.text,
    this.style,
    this.trimLines = 2,
  });

  @override
  State<_ExpandableDescription> createState() => _ExpandableDescriptionState();
}

class _ExpandableDescriptionState extends State<_ExpandableDescription> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final effectiveStyle = widget.style ?? GoogleFonts.outfit(
          fontWeight: FontWeight.w500,
          fontSize: 13,
          color: AppTheme.deepTeal,
          height: 1.3,
        );
        final span = TextSpan(
          text: widget.text,
          style: effectiveStyle,
        );
        final tp = TextPainter(
          text: span,
          textDirection: TextDirection.ltr,
          maxLines: widget.trimLines,
        );
        tp.layout(maxWidth: constraints.maxWidth > 0 ? constraints.maxWidth : 300);
        
        final isOverflowing = tp.didExceedMaxLines;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.text,
              style: span.style,
              maxLines: _isExpanded ? null : widget.trimLines,
              overflow: _isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
            ),
            if (isOverflowing) ...[
              const SizedBox(height: 3),
              GestureDetector(
                onTap: () => setState(() => _isExpanded = !_isExpanded),
                child: Text(
                  _isExpanded ? 'Show less' : 'Show more',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                    color: AppTheme.corporateBlue,
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

