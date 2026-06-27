import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/nic_codes.dart';
import '../../core/constants/tm_classes.dart';
import 'package:dropdown_button2/dropdown_button2.dart';

class ToolDetailScreen extends StatefulWidget {
  final String toolName;
  final dynamic icon;

  const ToolDetailScreen({
    super.key,
    required this.toolName,
    required this.icon,
  });

  @override
  State<ToolDetailScreen> createState() => _ToolDetailScreenState();
}

class _ToolDetailScreenState extends State<ToolDetailScreen> {
  // Input Controllers
  final _amountController = TextEditingController();
  final _rateController = TextEditingController();
  final _durationController = TextEditingController();
  final _searchController = TextEditingController();

  // Calculation Results
  double _primaryResult = 0.0;
  double _secondaryResult = 0.0;
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

  List<NicCode> _allNicCodes = [];
  List<NicCode> _filteredNicCodes = [];
  Map<NicCode, List<NicCode>> _groupedNicCodes = {};
  bool _isLoadingNic = false;

  List<TmClass> _allTmClasses = [];
  List<TmClass> _filteredTmClasses = [];
  bool _isLoadingTm = false;

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
    final codes = await NicCodeService.loadNicCodes();
    setState(() {
      _allNicCodes = codes;
      _filteredNicCodes = codes;
      _groupNicCodes();
      _isLoadingNic = false;
    });
  }

  void _initializeDefaults() {
    if (widget.toolName == 'GST Calc') {
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

  void _groupNicCodes() {
    _groupedNicCodes.clear();
    Set<NicCode> matchedClasses = {};
    
    // Use a hash map for O(1) lookups instead of O(N) firstWhere inside a loop!
    Map<String, NicCode> classMap = {};
    for (var item in _allNicCodes) {
      if (item.type == 'Class') {
        classMap[item.code] = item;
      }
    }

    for (var item in _filteredNicCodes) {
      if (item.type == 'Class') {
        matchedClasses.add(item);
      } else if (item.type == 'Sub-class') {
        String parentCode = item.code.length >= 4 ? item.code.substring(0, 4) : item.code;
        var parentClass = classMap[parentCode] ?? NicCode(code: parentCode, description: 'Unknown Class', type: 'Class');
        matchedClasses.add(parentClass);
      } else {
        matchedClasses.add(item);
      }
    }

    var limitedClasses = matchedClasses.take(50).toList();

    for (var cls in limitedClasses) {
      if (cls.type == 'Class') {
        var subs = _allNicCodes.where((n) => n.type == 'Sub-class' && n.code.startsWith(cls.code)).toList();
        _groupedNicCodes[cls] = subs;
      } else {
        _groupedNicCodes[cls] = [];
      }
    }
  }

  void _searchNic(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      setState(() {
        if (query.isEmpty) {
          _filteredNicCodes = _allNicCodes;
        } else {
          _filteredNicCodes = _allNicCodes
              .where((item) =>
                  item.code.contains(query) ||
                  item.description.toLowerCase().contains(query.toLowerCase()))
              .toList();
        }
        _groupNicCodes();
      });
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
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  height: 1.0,
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
                      !widget.toolName.contains('GST')) ...[
                    _buildHeaderWidget(),
                    const SizedBox(height: 32),
                  ],
                  _buildToolContent(),
                  if (widget.toolName != 'NIC Finder' && widget.toolName != 'Trade Mark Class' && !widget.toolName.contains('GST Calc')) ...[
                    const SizedBox(height: 32),
                    _buildResultCard(),
                  ],
                ],
              ),
            ),
          ),
          if (widget.toolName != 'NIC Finder' && widget.toolName != 'Trade Mark Class' && widget.toolName != 'TDS Interest') _buildNumpad(),
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
                  _buildInputLabel(widget.toolName == 'GST Calc' ? 'Rate (%)' : 'Rate (%) p.a.'),
                  _buildTextField(_rateController, 'e.g. 18', LucideIcons.percent, focusNode: _rateFocus),
                ],
              ),
            ),
            const SizedBox(width: 16),
            if (widget.toolName != 'GST Calc')
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
                      ? '${selectedDate.month.toString().padLeft(2, '0')}/${selectedDate.day.toString().padLeft(2, '0')}/${selectedDate.year}'
                      : 'mm/dd/yyyy',
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
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: CircularProgressIndicator(color: AppTheme.corporateBlue),
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
            onChanged: _searchNic,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w500,
              color: AppTheme.deepTeal,
            ),
            decoration: InputDecoration(
              hintText: 'Search by industry or code...',
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
          itemCount: _groupedNicCodes.length,
          itemBuilder: (context, index) {
            final parentClass = _groupedNicCodes.keys.elementAt(index);
            final subClasses = _groupedNicCodes[parentClass]!;
            
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
                child: Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    iconColor: AppTheme.corporateBlue,
                    collapsedIconColor: Colors.grey[400],
                    tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    title: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 65,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            parentClass.code,
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
                                'CLASS',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 10,
                                  color: AppTheme.corporateBlue.withOpacity(0.8),
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                parentClass.description,
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13,
                                  color: AppTheme.deepTeal,
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    children: subClasses.isEmpty
                        ? [
                            Padding(
                              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
                              child: Row(
                                children: [
                                  Icon(LucideIcons.info, size: 16, color: Colors.grey[400]),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'No specific sub-classes matched or available.',
                                      style: GoogleFonts.outfit(color: Colors.grey[500], fontSize: 13),
                                    ),
                                  ),
                                ],
                              ),
                            )
                          ]
                        : [
                            const Divider(height: 1, color: Color(0xFFF0F0F0)),
                            ...subClasses.asMap().entries.map((entry) {
                              final isLast = entry.key == subClasses.length - 1;
                              final item = entry.value;
                              return Column(
                                children: [
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                    color: entry.key.isEven ? Colors.grey[50] : Colors.white,
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                          Container(
                                            width: 65,
                                            alignment: Alignment.center,
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                                            decoration: BoxDecoration(
                                            color: Colors.black.withOpacity(0.08),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            item.code,
                                            style: GoogleFonts.outfit(
                                              fontWeight: FontWeight.w700,
                                              color: Colors.black,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            item.description,
                                            style: GoogleFonts.outfit(
                                              fontWeight: FontWeight.w400,
                                              fontSize: 13,
                                              color: Colors.grey[800],
                                              height: 1.4,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (!isLast)
                                    const Divider(height: 1, color: Color(0xFFF0F0F0)),
                                ],
                              );
                            }).toList(),
                          ],
                  ),
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
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: CircularProgressIndicator(color: AppTheme.corporateBlue),
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
                widget.toolName == 'GST Calc' ? 'Total Payable' : 'Interest Amount',
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
            '₹${_primaryResult.toStringAsFixed(2)}',
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
                _buildOutputColumn('₹${_actualAmount.toStringAsFixed(0)}', 'Actual Amount', Colors.blue.shade700),
                Text('+', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade400)),
                _buildOutputColumn('₹${_gstAmount.toStringAsFixed(0)}', 'GST Amount', Colors.green),
                Text('=', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey.shade400)),
                _buildOutputColumn('₹${_totalAmount.toStringAsFixed(0)}', 'Total Amount', Colors.blue.shade700),
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
        child: DropdownButton2<String>(
          valueListenable: valueListenable,
          isExpanded: true,
          buttonStyleData: const ButtonStyleData(
            padding: EdgeInsets.symmetric(horizontal: 16),
            height: 54,
          ),
          iconStyleData: const IconStyleData(
            icon: Icon(LucideIcons.chevronDown, size: 20, color: Colors.grey),
          ),
          dropdownStyleData: DropdownStyleData(
            elevation: 2,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: Colors.white,
            ),
          ),
          menuItemStyleData: const MenuItemStyleData(
            padding: EdgeInsets.symmetric(horizontal: 16),
          ),
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
          items: items.map((String item) {
            return DropdownItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
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
                fontWeight: FontWeight.w800,
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
    if (_focusedController == null) {
      _focusedController = _amountController;
    }
    
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
      decoration: BoxDecoration(
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

  const _ExpandableDescription({required this.text});

  @override
  State<_ExpandableDescription> createState() => _ExpandableDescriptionState();
}

class _ExpandableDescriptionState extends State<_ExpandableDescription> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final span = TextSpan(
          text: widget.text,
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w500,
            fontSize: 13,
            color: AppTheme.deepTeal,
            height: 1.3,
          ),
        );
        final tp = TextPainter(
          text: span,
          textDirection: TextDirection.ltr,
          maxLines: 3,
        );
        tp.layout(maxWidth: constraints.maxWidth);
        
        final isOverflowing = tp.didExceedMaxLines;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.text,
              style: span.style,
              maxLines: _isExpanded ? null : 3,
              overflow: _isExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
            ),
            if (isOverflowing) ...[
              const SizedBox(height: 4),
              InkWell(
                onTap: () => setState(() => _isExpanded = !_isExpanded),
                child: Text(
                  _isExpanded ? 'View less' : 'View more',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
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

