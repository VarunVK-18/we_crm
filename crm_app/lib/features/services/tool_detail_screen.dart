import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/nic_codes.dart';
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

  List<NicCode> _filteredNicCodes = [];

  @override
  void initState() {
    super.initState();
    _filteredNicCodes = allNicCodes;
    _initializeDefaults();
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

  void _searchNic(String query) {
    setState(() {
      _filteredNicCodes = allNicCodes
          .where((item) =>
              item.code.contains(query) ||
              item.description.toLowerCase().contains(query.toLowerCase()))
          .toList();
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
        title: Text(
          widget.toolName,
          style: GoogleFonts.outfit(
            color: AppTheme.deepTeal,
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -0.5,
          ),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeaderWidget(),
            const SizedBox(height: 32),
            _buildToolContent(),
            const SizedBox(height: 40),
            if (widget.toolName != 'NIC Finder' && !widget.toolName.contains('GST Calc')) _buildResultCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderWidget() {
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
      default:
        return 'Professional utility for business compliance management.';
    }
  }

  Widget _buildToolContent() {
    if (widget.toolName == 'NIC Finder') {
      return _buildNICFinder();
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
        _buildTextField(_amountController, 'e.g. 10000', LucideIcons.indianRupee),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInputLabel(widget.toolName == 'GST Calc' ? 'Rate (%)' : 'Rate (%) p.a.'),
                  _buildTextField(_rateController, 'e.g. 18', LucideIcons.percent),
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
                    _buildTextField(_durationController, 'Duration', LucideIcons.clock),
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

  Widget _buildTextField(TextEditingController controller, String hint, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
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
            margin: const EdgeInsets.all(8),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.grey[600], size: 18),
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
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

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInputLabel('Enter Amount Of Tax Deducted'),
              _buildTextField(_amountController, 'e.g. 100000', LucideIcons.indianRupee),
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
          ),
        );
      },
    );
  }

  Widget _buildNICFinder() {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: _searchNic,
            decoration: const InputDecoration(
              hintText: 'Search by industry or code...',
              prefixIcon: Icon(LucideIcons.search, size: 20),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ),
        const SizedBox(height: 24),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredNicCodes.length,
          itemBuilder: (context, index) {
            final item = _filteredNicCodes[index];
            final isClass = item.type == 'Class';
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isClass ? Colors.blue.shade50 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: isClass ? Colors.blue.shade200 : Colors.grey[100]!),
                boxShadow: [
                  if (isClass)
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    )
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isClass
                          ? AppTheme.corporateBlue
                          : AppTheme.corporateBlue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      item.code,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        color: isClass ? Colors.white : AppTheme.corporateBlue,
                        fontSize: 12,
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
                            fontWeight: FontWeight.w800,
                            fontSize: 9,
                            color: isClass ? AppTheme.corporateBlue : Colors.grey[500],
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.description,
                          style: GoogleFonts.outfit(
                            fontWeight: isClass ? FontWeight.w700 : FontWeight.w600,
                            fontSize: 14,
                            color: AppTheme.deepTeal,
                          ),
                        ),
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
        borderRadius: BorderRadius.circular(32),
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInputLabel('Amount'),
          _buildTextField(_amountController, 'e.g. 10000', LucideIcons.indianRupee),
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
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildOutputColumn('₹${_actualAmount.toStringAsFixed(0)}', 'Actual Amount', Colors.blue.shade700),
                Text('+', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey.shade400)),
                _buildOutputColumn('₹${_gstAmount.toStringAsFixed(0)}', 'GST Amount', Colors.green),
                Text('=', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey.shade400)),
                _buildOutputColumn('₹${_totalAmount.toStringAsFixed(0)}', 'Total Amount', Colors.blue.shade700),
              ],
            ),
          ),
        ],
      ),
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
        borderRadius: BorderRadius.circular(16),
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
              borderRadius: BorderRadius.circular(16),
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
          Text(
            amount,
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.deepTeal,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
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
