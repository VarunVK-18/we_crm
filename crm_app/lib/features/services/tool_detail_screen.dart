import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';

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

  // NIC Mock Data
  final List<Map<String, String>> _allNicCodes = [
    {'code': '62011', 'desc': 'Software development services'},
    {'code': '62020', 'desc': 'Computer consultancy and services'},
    {'code': '47110', 'desc': 'Retail sale in non-specialized stores'},
    {'code': '56101', 'desc': 'Restaurants and mobile food service'},
    {'code': '70200', 'desc': 'Management consultancy activities'},
    {'code': '45101', 'desc': 'Sale of motor vehicles'},
    {'code': '10712', 'desc': 'Manufacture of bread and bakery products'},
    {'code': '85101', 'desc': 'Primary education services'},
  ];
  List<Map<String, String>> _filteredNicCodes = [];

  @override
  void initState() {
    super.initState();
    _filteredNicCodes = _allNicCodes;
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
      if (widget.toolName == 'GST Calc') {
        _secondaryResult = (amount * rate) / 100;
        _primaryResult = amount + _secondaryResult;
        _detailMessage = 'Base: ₹${amount.toStringAsFixed(0)} + GST: ${rate}%';
      } else if (widget.toolName == 'GST Interest') {
        // GST Interest: 18% p.a. daily
        _primaryResult = (amount * (rate / 100) / 365) * duration;
        _detailMessage = 'Interest calculated at ${rate}% p.a. for ${duration.toStringAsFixed(0)} days';
      } else if (widget.toolName == 'TDS Interest') {
        // TDS Interest: 1.5% p.m.
        _primaryResult = amount * (rate / 100) * duration;
        _detailMessage = 'Interest calculated at ${rate}% p.m. for ${duration.toStringAsFixed(0)} months';
      }
    });
  }

  void _searchNic(String query) {
    setState(() {
      _filteredNicCodes = _allNicCodes
          .where((item) =>
              item['code']!.contains(query) ||
              item['desc']!.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
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
            if (widget.toolName != 'NIC Finder') _buildResultCard(),
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
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        onChanged: (_) => _calculate(),
        style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, size: 18, color: Colors.grey),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildNICFinder() {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.grey[50],
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
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey[100]!),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.corporateBlue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      item['code']!,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w900,
                        color: AppTheme.corporateBlue,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      item['desc']!,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: AppTheme.deepTeal,
                      ),
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

  @override
  void dispose() {
    _amountController.dispose();
    _rateController.dispose();
    _durationController.dispose();
    _searchController.dispose();
    super.dispose();
  }
}
