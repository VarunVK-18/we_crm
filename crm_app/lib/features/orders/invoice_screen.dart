import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../models/order_model.dart';
import '../../providers/settings_provider.dart';

// ─── Number to Words ──────────────────────────────────────────────────────────
String numberToWords(double number) {
  if (number == 0) return 'Zero Rupees Only';
  
  final units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  final tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  String convertWholeNumber(int n) {
    if (n < 20) return units[n];
    if (n < 100) return tens[n ~/ 10] + (n % 10 != 0 ? ' ' + units[n % 10] : '');
    if (n < 1000) return units[n ~/ 100] + ' Hundred' + (n % 100 != 0 ? ' and ' + convertWholeNumber(n % 100) : '');
    if (n < 100000) return convertWholeNumber(n ~/ 1000) + ' Thousand' + (n % 1000 != 0 ? ' ' + convertWholeNumber(n % 1000) : '');
    if (n < 10000000) return convertWholeNumber(n ~/ 100000) + ' Lakh' + (n % 100000 != 0 ? ' ' + convertWholeNumber(n % 100000) : '');
    return convertWholeNumber(n ~/ 10000000) + ' Crore' + (n % 10000000 != 0 ? ' ' + convertWholeNumber(n % 10000000) : '');
  }
  
  int rupees = number.floor();
  int paise = ((number - rupees) * 100).round();
  
  String result = convertWholeNumber(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertWholeNumber(paise) + ' Paise';
  }
  return result + ' Only';
}

// ─── Invoice Screen ───────────────────────────────────────────────────────────

class InvoiceScreen extends ConsumerWidget {
  final ServiceOrder order;
  const InvoiceScreen({super.key, required this.order});

  String get _invoiceNumber {
    final customId = order.customServiceId;
    if (customId.isNotEmpty) {
      final numberPart = customId.replaceAll(RegExp(r'[^0-9]'), '');
      final year = order.createdAt.toLocal().year.toString();
      return '#WE$year$numberPart';
    }
    return '#WE${DateFormat('yyMMddHHmm').format(order.createdAt.toLocal())}';
  }

  double get _servicePrice =>
      order.dealClosedAmount > 0 ? order.dealClosedAmount : 4999.00;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(companySettingsProvider);
    final settings = settingsAsync.value ?? const CompanySettings();
    final cgstRate = settings.cgstPercentage / 100;
    final sgstRate = settings.sgstPercentage / 100;
    final cgstAmount = order.isGstApplicable ? _servicePrice * cgstRate : 0.0;
    final sgstAmount = order.isGstApplicable ? _servicePrice * sgstRate : 0.0;
    final total = _servicePrice + cgstAmount + sgstAmount;
    final dateStr = DateFormat('dd MMM yyyy').format(order.createdAt);
    final fmt = NumberFormat('#,##,##0.00');

    final companyName = settings.companyDetails.companyName.isNotEmpty ? settings.companyDetails.companyName : 'WEALTH EMPIRES';
    final gstin = settings.companyDetails.gstin.isNotEmpty ? settings.companyDetails.gstin : '33AAICA9876C1Z4';
    final address = settings.companyDetails.address.isNotEmpty ? settings.companyDetails.address : 'No 1, Wealth Empires Tower, Chennai';
    final phone = settings.companyDetails.phone.isNotEmpty ? settings.companyDetails.phone : '+91 9876543210';
    final email = 'contact@wealthempires.com'; 

    final qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=256x256&margin=1&data=${Uri.encodeComponent("https://wealthempires.com/invoice/$_invoiceNumber")}';
    
    final svgStamp = '''<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="60" cy="60" r="45" fill="none" stroke="#2563eb" stroke-width="1"/>
      <g transform="rotate(-15 60 60)">
        <rect x="10" y="45" width="100" height="30" rx="4" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="60" y="60" fill="#2563eb" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">${companyName.toUpperCase()}</text>
        <text x="60" y="70" fill="#2563eb" font-size="8" font-family="sans-serif" text-anchor="middle">VERIFIED</text>
      </g>
    </svg>''';

    return Scaffold(
      backgroundColor: const Color(0xFFF6F8FB),

      body: SafeArea(child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          children: [
            // Custom Toolbar matching web app
            Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: const [
                  BoxShadow(color: Color(0x0C000000), blurRadius: 3, offset: Offset(0, 1)),
                ],
              ),
              child: Row(
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2563EB),
                      side: const BorderSide(color: Color(0xFF2563EB)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                      minimumSize: const Size(0, 38),
                    ),
                    child: const Text('Back', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Text('INVOICE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 1.2)),
                        Text(_invoiceNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: () => _shareOrDownloadPdf(context, settings, cgstRate, sgstRate),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                      minimumSize: const Size(0, 38),
                      elevation: 0,
                    ),
                    child: const Text('Print', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),

            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                boxShadow: [
                  BoxShadow(color: const Color(0xFFCBD5E1).withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // TAX INVOICE Header Bar
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      border: Border(bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('TAX INVOICE', style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1.5)),
                        Text('ORIGINAL FOR RECIPIENT', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold, fontSize: 4, letterSpacing: 1)),
                      ],
                    ),
                  ),

                  // Header Grid (Left and Right)
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Left Column
                        Expanded(
                          flex: 6,
                          child: Container(
                            decoration: const BoxDecoration(
                              border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5), bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Sender Info
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: const BoxDecoration(
                                    border: Border(bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1)),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 48,
                                        height: 48,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: const Color.fromARGB(255, 255, 255, 255),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Image.asset('assets/WE CRM logo .png', fit: BoxFit.contain, errorBuilder: (_,__,___) => const Text('LOGO', style: TextStyle(fontWeight: FontWeight.bold))),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(companyName.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 7), maxLines: 1, overflow: TextOverflow.ellipsis),
                                            const SizedBox(height: 2),
                                            // Text('GSTIN: $gstin', style: const TextStyle(fontSize: 5, fontWeight: FontWeight.bold)),
                                            // const SizedBox(height: 2),
                                            Text(address, style: const TextStyle(fontSize: 5, color: Color(0xFF4B5563)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                            const SizedBox(height: 2),
                                            Text('Mobile: $phone\nEmail: $email', style: const TextStyle(fontSize: 5, color: Color(0xFF4B5563)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Customer Info
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('CUSTOMER DETAILS:', style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold, color: Color(0xFF4B5563), letterSpacing: 0.5)),
                                      const SizedBox(height: 6),
                                      Text(order.companyName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 8)),
                                      const SizedBox(height: 4),
                                      const Text('Billing address:', style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
                                      Text('${order.entityName}\nIndia', style: const TextStyle(fontSize: 6, color: Color(0xFF4B5563))),
                                      const SizedBox(height: 4),
                                      if (order.expertPhone.isNotEmpty) Text('Ph: ${order.expertPhone}', style: const TextStyle(fontSize: 5, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Right Column
                        Expanded(
                          flex: 4,
                          child: Container(
                            decoration: const BoxDecoration(
                              border: Border(bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                IntrinsicHeight(
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1), bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1))),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text('INVOICE #:', style: TextStyle(fontSize: 4, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                                              Text(_invoiceNumber, style: const TextStyle(fontSize: 6, fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1))),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text('INVOICE DATE:', style: TextStyle(fontSize: 4, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                                              Text(dateStr, style: const TextStyle(fontSize: 6, fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('SCAN TO VIEW E-INVOICE', style: TextStyle(fontSize: 4, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                                        const SizedBox(height: 8),
                                        Center(
                                          child: Image.network(
                                            qrUrl,
                                            width: 60,
                                            height: 60,
                                            errorBuilder: (context, error, stackTrace) => Container(
                                              width: 60, height: 60, decoration: const BoxDecoration(),
                                              alignment: Alignment.center, child: const Text('QR', style: TextStyle(fontSize: 5, color: Colors.grey)),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Table
                  Table(
                    border: TableBorder.all(color: const Color(0xFFCBD5E1), width: 1),
                    columnWidths: const {
                      0: FlexColumnWidth(1),
                      1: FlexColumnWidth(3),
                      2: FlexColumnWidth(2),
                      3: FlexColumnWidth(2),
                      4: FlexColumnWidth(1),
                      5: FlexColumnWidth(2),
                      6: FlexColumnWidth(2),
                      7: FlexColumnWidth(2.5),
                    },
                    children: [
                      // Header
                      TableRow(
                        decoration: const BoxDecoration(color: Color(0xFFF8FAFC)),
                        children: [
                          _buildTh('#'),
                          _buildTh('ITEM'),
                          _buildTh('HSN/SAC'),
                          _buildTh('RATE/ITEM'),
                          _buildTh('QTY'),
                          _buildTh('TAXABLE'),
                          _buildTh('TAX'),
                          _buildTh('AMOUNT'),
                        ],
                      ),
                      // Item Row
                      TableRow(
                        children: [
                          _buildTd('1', align: TextAlign.center),
                          _buildTd(order.serviceType, bold: true),
                          _buildTd('998311', align: TextAlign.center),
                          _buildTd(fmt.format(_servicePrice), align: TextAlign.right),
                          _buildTd('1', align: TextAlign.center),
                          _buildTd(fmt.format(_servicePrice), align: TextAlign.right),
                          _buildTd('${fmt.format(cgstAmount + sgstAmount)}\n(${((cgstRate + sgstRate) * 100).toStringAsFixed(0)}%)', align: TextAlign.right),
                          _buildTd(fmt.format(total), align: TextAlign.right, bold: true),
                        ],
                      ),

                    ],
                  ),
                  
                  // Totals Section OUTSIDE of Table to avoid complex table cell merges that Flutter doesn't like
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Left summary
                        Expanded(
                          flex: 90,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              border: Border(
                                right: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5),
                                bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5),
                              ),
                            ),
                            child: const Text('Total Items / Qty : 1 / 1.000', style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
                          ),
                        ),
                        // Right summary
                        Expanded(
                          flex: 65,
                          child: Container(
                            decoration: const BoxDecoration(
                              border: Border(
                                bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _buildSummaryLine('Taxable Amount', fmt.format(_servicePrice)),
                                if (order.isGstApplicable) _buildSummaryLine('CGST (${(cgstRate * 100).toStringAsFixed(1)}%)', fmt.format(cgstAmount)),
                                if (order.isGstApplicable) _buildSummaryLine('SGST (${(sgstRate * 100).toStringAsFixed(1)}%)', fmt.format(sgstAmount)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFF8FAFC),
                                    border: Border(top: BorderSide(color: const Color(0xFFCBD5E1), width: 1)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Total', style: TextStyle(fontSize: 6)),
                                      Text(fmt.format(total), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Amount in words
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      border: Border(bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5)),
                    ),
                    child: Text(
                      'Total amount (in words): ${numberToWords(total)}',
                      style: const TextStyle(fontSize: 5, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                    ),
                  ),

                  // GST Breakdown Table
                  if (order.isGstApplicable)
                    Table(
                      border: const TableBorder(
                        bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1.5),
                        verticalInside: BorderSide(color: const Color(0xFFCBD5E1), width: 1),
                        horizontalInside: BorderSide(color: const Color(0xFFCBD5E1), width: 1),
                      ),
                      columnWidths: const {
                        0: FlexColumnWidth(1.0),
                        1: FlexColumnWidth(1.5),
                        2: FlexColumnWidth(2.4),
                        3: FlexColumnWidth(2.4),
                        4: FlexColumnWidth(1.2),
                      },
                      children: [
                        TableRow(
                          decoration: const BoxDecoration(color: Color(0xFFF8FAFC)),
                          children: [
                            const Padding(padding: EdgeInsets.all(6), child: Text('HSN/SAC', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold))),
                            const Padding(padding: EdgeInsets.all(6), child: Text('TAXABLE VALUE', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold))),
                            Padding(
                              padding: EdgeInsets.zero,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Padding(padding: EdgeInsets.all(4), child: Text('CENTRAL TAX', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold))),
                                  Container(height: 1, color: const Color(0xFFCBD5E1)),
                                  Row(
                                    children: [
                                      Expanded(child: Container(decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1))), padding: const EdgeInsets.all(4), child: const Text('RATE', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold)))),
                                      Expanded(child: Container(padding: const EdgeInsets.all(4), child: const Text('AMOUNT', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold)))),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                              padding: EdgeInsets.zero,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Padding(padding: EdgeInsets.all(4), child: Text('STATE TAX', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold))),
                                  Container(height: 1, color: const Color(0xFFCBD5E1)),
                                  Row(
                                    children: [
                                      Expanded(child: Container(decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1))), padding: const EdgeInsets.all(4), child: const Text('RATE', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold)))),
                                      Expanded(child: Container(padding: const EdgeInsets.all(4), child: const Text('AMOUNT', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold)))),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const Padding(padding: EdgeInsets.all(6), child: Text('TOTAL TAX\nAMOUNT', textAlign: TextAlign.center, style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold))),
                          ],
                        ),
                        // Data Row
                        TableRow(
                          children: [
                            _buildSmallTd('998311', align: TextAlign.center),
                            _buildSmallTd(fmt.format(_servicePrice), align: TextAlign.right),
                            Row(children: [ Expanded(child: Container(decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1))), child: _buildSmallTd('${(cgstRate*100).toStringAsFixed(0)}%', align: TextAlign.center))), Expanded(child: _buildSmallTd(fmt.format(cgstAmount), align: TextAlign.right)) ]),
                            Row(children: [ Expanded(child: Container(decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1))), child: _buildSmallTd('${(sgstRate*100).toStringAsFixed(0)}%', align: TextAlign.center))), Expanded(child: _buildSmallTd(fmt.format(sgstAmount), align: TextAlign.right)) ]),
                            _buildSmallTd(fmt.format(cgstAmount + sgstAmount), align: TextAlign.right),
                          ],
                        ),
                        // Total Row
                        TableRow(
                          decoration: const BoxDecoration(color: Color(0xFFF8FAFC)),
                          children: [
                            _buildSmallTd('TOTAL', align: TextAlign.center, bold: true),
                            _buildSmallTd(fmt.format(_servicePrice), align: TextAlign.right, bold: true),
                            Row(children: [ Expanded(child: Container(decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1))), child: _buildSmallTd('—', align: TextAlign.center, bold: true))), Expanded(child: _buildSmallTd(fmt.format(cgstAmount), align: TextAlign.right, bold: true)) ]),
                            Row(children: [ Expanded(child: Container(decoration: const BoxDecoration(border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1))), child: _buildSmallTd('—', align: TextAlign.center, bold: true))), Expanded(child: _buildSmallTd(fmt.format(sgstAmount), align: TextAlign.right, bold: true)) ]),
                            _buildSmallTd(fmt.format(cgstAmount + sgstAmount), align: TextAlign.right, bold: true),
                          ],
                        ),
                      ],
                    ),
                  
                  // FOOTER
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Bank Details
                        Expanded(
                          flex: 6,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: const BoxDecoration(
                              border: Border(right: BorderSide(color: const Color(0xFFCBD5E1), width: 1)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('BANK DETAILS:', style: TextStyle(fontSize: 5, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                                const SizedBox(height: 6),
                                if (settings.bankDetails.bankName.isNotEmpty) ...[
                                  _buildBankLine('Bank:', settings.bankDetails.bankName),
                                  _buildBankLine('Account #:', settings.bankDetails.accountNumber),
                                  _buildBankLine('IFSC:', settings.bankDetails.ifsc),
                                  _buildBankLine('Branch:', settings.bankDetails.branchName),
                                ] else ...[
                                  const Text('Bank details not configured.', style: TextStyle(fontSize: 4, color: Color(0xFF64748B))),
                                ],
                              ],
                            ),
                          ),
                        ),
                        // Signature
                        Expanded(
                          flex: 4,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text('For ${companyName.toUpperCase()}', style: const TextStyle(fontSize: 4, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
                                const SizedBox(height: 10),
                                Image.asset(
                                  'assets/sign.png',
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.contain,
                                ),
                                const SizedBox(height: 10),
                                const Text('Authorized Signatory', style: TextStyle(fontSize: 4, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // NOTES & TERMS
                  IntrinsicHeight(
                    child: Container(
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Color(0xFFCBD5E1), width: 1.5),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            flex: 1,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: const BoxDecoration(
                                border: Border(right: BorderSide(color: Color(0xFFCBD5E1), width: 1.5)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('NOTES:', style: TextStyle(fontSize: 6, color: Color(0xFF475569))),
                                  const SizedBox(height: 8),
                                  const Text('Thank you for the Business', style: TextStyle(fontSize: 6, color: Color(0xFF475569))),
                                ],
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 1,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('TERMS AND CONDITIONS:', style: TextStyle(fontSize: 6, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                                  const SizedBox(height: 4),
                                  const Text('1. Goods once sold cannot be taken back or exchanged.', style: TextStyle(fontSize: 5, color: Color(0xFF475569))),
                                  const Text('2. We stand for warranty as per company terms.', style: TextStyle(fontSize: 5, color: Color(0xFF475569))),
                                  const Text('3. Interest @24% p.a. charged after 15 days.', style: TextStyle(fontSize: 5, color: Color(0xFF475569))),
                                  const Text('4. Subject to local Jurisdiction.', style: TextStyle(fontSize: 5, color: Color(0xFF475569))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                ],
              ),
            ),
          ],
        ),
      ),
    ));
  } 

  // ── PDF Generation Logic ──────────────────────────────────────────────────

  Future<pw.Document> _buildPdf(CompanySettings settings, double cgstRate, double sgstRate) async {
    final pdf = pw.Document();

    final font = await PdfGoogleFonts.interRegular();
    final fontBold = await PdfGoogleFonts.interBold();
    final fontExtraBold = await PdfGoogleFonts.interExtraBold();

    pw.MemoryImage? logoImage;
    try {
      final logoData = await rootBundle.load('assets/WE CRM logo .png');
      logoImage = pw.MemoryImage(
        logoData.buffer.asUint8List(logoData.offsetInBytes, logoData.lengthInBytes),
      );
    } catch (e) {
      debugPrint('Error loading logo: $e');
    }

    pw.MemoryImage? signImage;
    try {
      final signData = await rootBundle.load('assets/sign.png');
      signImage = pw.MemoryImage(
        signData.buffer.asUint8List(signData.offsetInBytes, signData.lengthInBytes),
      );
    } catch (e) {
      debugPrint('Error loading signature image: $e');
    }

    final dateStr = DateFormat('dd MMM yyyy').format(order.createdAt);
    final fmt = NumberFormat('#,##,##0.00');
    final cgstAmount = order.isGstApplicable ? _servicePrice * cgstRate : 0.0;
    final sgstAmount = order.isGstApplicable ? _servicePrice * sgstRate : 0.0;
    final total = _servicePrice + cgstAmount + sgstAmount;

    final companyName = settings.companyDetails.companyName.isNotEmpty ? settings.companyDetails.companyName : 'WEALTH EMPIRES';
    final gstin = settings.companyDetails.gstin.isNotEmpty ? settings.companyDetails.gstin : '33AAICA9876C1Z4';
    final address = settings.companyDetails.address.isNotEmpty ? settings.companyDetails.address : 'No 1, Wealth Empires Tower, Chennai';
    final phone = settings.companyDetails.phone.isNotEmpty ? settings.companyDetails.phone : '+91 9876543210';
    final email = 'contact@wealthempires.com';
    final bankName = settings.bankDetails.bankName.isNotEmpty ? settings.bankDetails.bankName : '';
    final accNo = settings.bankDetails.accountNumber;
    final ifsc = settings.bankDetails.ifsc;
    final branch = settings.bankDetails.branchName;

    final svgStamp = '''<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="60" cy="60" r="45" fill="none" stroke="#2563eb" stroke-width="1"/>
      <g transform="rotate(-15 60 60)">
        <rect x="10" y="45" width="100" height="30" rx="4" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="60" y="60" fill="#2563eb" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">${companyName.toUpperCase()}</text>
        <text x="60" y="70" fill="#2563eb" font-size="8" font-family="sans-serif" text-anchor="middle">VERIFIED</text>
      </g>
    </svg>''';

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: pw.EdgeInsets.all(24),
        theme: pw.ThemeData.withFont(base: font, bold: fontBold),
        build: (pw.Context context) {
          return pw.Container(
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                // TAX INVOICE TOP BAR
                pw.Container(
                  padding: pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFF8FAFC),
                    border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5)),
                  ),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('TAX INVOICE', style: pw.TextStyle(color: const PdfColor.fromInt(0xFF2563EB), fontWeight: pw.FontWeight.bold, font: fontExtraBold, fontSize: 9, letterSpacing: 1.5)),
                      pw.Text('ORIGINAL FOR RECIPIENT', style: pw.TextStyle(color: const PdfColor.fromInt(0xFF475569), fontWeight: pw.FontWeight.bold, fontSize: 5, letterSpacing: 0.5)),
                    ],
                  ),
                ),

                // HEADER MAIN GRID
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    // Left Col
                    pw.Expanded(
                      flex: 6,
                      child: pw.Container(
                        decoration: pw.BoxDecoration(
                          border: pw.Border(
                            right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                            bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                          ),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                          children: [
                            // Sender Info
                            pw.Container(
                              padding: pw.EdgeInsets.all(12),
                              decoration:  pw.BoxDecoration(
                                border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1)),
                              ),
                              child: pw.Row(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Container(
                                    width: 48, height: 48,
                                    child: logoImage != null ? pw.Image(logoImage, fit: pw.BoxFit.contain) : pw.Text('LOGO'),
                                  ),
                                  pw.SizedBox(width: 12),
                                  pw.Expanded(
                                    child: pw.Column(
                                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                                      children: [
                                        pw.Text(companyName.toUpperCase(), style: pw.TextStyle(font: fontExtraBold, fontSize: 7)),
                                        pw.SizedBox(height: 2),
                                        // pw.Text('GSTIN: $gstin', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold)),
                                        // pw.SizedBox(height: 4),
                                        pw.Text(address, style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF4B5563))),
                                        pw.SizedBox(height: 2),
                                        pw.Text('Mobile: $phone\nEmail: $email', style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF4B5563))),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Client Info
                            pw.Container(
                              padding: pw.EdgeInsets.all(12),
                              child: pw.Column(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text('CUSTOMER DETAILS:', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563))),
                                  pw.SizedBox(height: 4),
                                  pw.Text(order.companyName, style: pw.TextStyle(font: fontExtraBold, fontSize: 8)),
                                  pw.SizedBox(height: 4),
                                  pw.Text('Billing address:', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold)),
                                  pw.Text('${order.entityName}\nIndia', style: const pw.TextStyle(fontSize: 6, color: PdfColor.fromInt(0xFF4B5563))),
                                  pw.SizedBox(height: 4),
                                  if (order.expertPhone.isNotEmpty) pw.Text('Ph: ${order.expertPhone}', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Right Col
                    pw.Expanded(
                      flex: 4,
                      child: pw.Container(
                        decoration: pw.BoxDecoration(
                          border: pw.Border(
                            bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                          ),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                          children: [
                            pw.Row(
                              crossAxisAlignment: pw.CrossAxisAlignment.start,
                              children: [
                                pw.Expanded(
                                  child: pw.Container(
                                    padding: pw.EdgeInsets.all(8),
                                    decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1), bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))),
                                    child: pw.Column(
                                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                                      children: [
                                        pw.Text('INVOICE #:', style: pw.TextStyle(fontSize: 4, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563))),
                                        pw.Text(_invoiceNumber, style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ),
                                pw.Expanded(
                                  child: pw.Container(
                                    padding: pw.EdgeInsets.all(8),
                                    decoration: pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))),
                                    child: pw.Column(
                                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                                      children: [
                                        pw.Text('INVOICE DATE:', style: pw.TextStyle(fontSize: 4, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563))),
                                        pw.Text(dateStr, style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            pw.Container(
                              padding: pw.EdgeInsets.all(12),
                              child: pw.Column(
                                crossAxisAlignment: pw.CrossAxisAlignment.start,
                                children: [
                                  pw.Text('SCAN TO VIEW E-INVOICE', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563))),
                                  pw.SizedBox(height: 8),
                                  pw.Center(
                                    child: pw.Container(
                                      width: 60, height: 60,
                                      child: pw.BarcodeWidget(
                                        barcode: pw.Barcode.qrCode(),
                                        data: 'https://wealthempires.com/invoice/$_invoiceNumber',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // TABLE
                pw.Table(
                  border: pw.TableBorder.all(color: PdfColor.fromHex("#CBD5E1"), width: 1),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1),
                    1: pw.FlexColumnWidth(3),
                    2: pw.FlexColumnWidth(2),
                    3: pw.FlexColumnWidth(2),
                    4: pw.FlexColumnWidth(1),
                    5: pw.FlexColumnWidth(2),
                    6: pw.FlexColumnWidth(2),
                    7: pw.FlexColumnWidth(2.5),
                  },
                  children: [
                    // Header
                    pw.TableRow(
                      decoration: pw.BoxDecoration(color: PdfColor.fromInt(0xFFF8FAFC)),
                      children: [
                        _pdfTh('#'),
                        _pdfTh('ITEM'),
                        _pdfTh('HSN/SAC'),
                        _pdfTh('RATE/ITEM'),
                        _pdfTh('QTY'),
                        _pdfTh('TAXABLE'),
                        _pdfTh('TAX'),
                        _pdfTh('AMOUNT'),
                      ],
                    ),
                    // Item Row
                    pw.TableRow(
                      children: [
                        _pdfTd('1', align: pw.TextAlign.center),
                        _pdfTd(order.serviceType, bold: true),
                        _pdfTd('998311', align: pw.TextAlign.center),
                        _pdfTd(fmt.format(_servicePrice), align: pw.TextAlign.right),
                        _pdfTd('1', align: pw.TextAlign.center),
                        _pdfTd(fmt.format(_servicePrice), align: pw.TextAlign.right),
                        _pdfTd('${fmt.format(cgstAmount + sgstAmount)}\n(${((cgstRate + sgstRate) * 100).toStringAsFixed(0)}%)', align: pw.TextAlign.right),
                        _pdfTd(fmt.format(total), align: pw.TextAlign.right, bold: true),
                      ],
                    ),

                  ],
                ),

                // TOTALS SUMMARY
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    // Left summary
                    pw.Expanded(
                      flex: 90,
                      child: pw.Container(
                        padding: pw.EdgeInsets.all(8),
                        decoration: pw.BoxDecoration(
                          border: pw.Border(
                            right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                            bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                          ),
                        ),
                        child: pw.Text('Total Items / Qty : 1 / 1.000', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF374151))),
                      ),
                    ),
                    // Right summary
                    pw.Expanded(
                      flex: 65,
                      child: pw.Container(
                        decoration: pw.BoxDecoration(
                          border: pw.Border(
                            bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                          ),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                          children: [
                            _pdfSummaryLine('Taxable Amount', fmt.format(_servicePrice)),
                            if (order.isGstApplicable) _pdfSummaryLine('CGST (${(cgstRate * 100).toStringAsFixed(1)}%)', fmt.format(cgstAmount)),
                            if (order.isGstApplicable) _pdfSummaryLine('SGST (${(sgstRate * 100).toStringAsFixed(1)}%)', fmt.format(sgstAmount)),
                            pw.Container(
                              padding: pw.EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: pw.BoxDecoration(
                                color: PdfColor.fromInt(0xFFF8FAFC),
                                border: pw.Border(top: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1)),
                              ),
                              child: pw.Row(
                                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                                children: [
                                  pw.Text('Total', style: const pw.TextStyle(fontSize: 6)),
                                  pw.Text(fmt.format(total), style: pw.TextStyle(fontSize: 8, font: fontExtraBold)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // Amount in words
                pw.Container(
                  width: double.infinity,
                  padding: pw.EdgeInsets.all(8),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFF8FAFC),
                    border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5)),
                  ),
                  child: pw.Text(
                    'Total amount (in words): ${numberToWords(total)}',
                    style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF374151)),
                  ),
                ),

                // GST Breakdown Table
                if (order.isGstApplicable)
                  pw.Table(
                    border: pw.TableBorder(
                      bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                      verticalInside: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1),
                      horizontalInside: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1),
                    ),
                    columnWidths: const {
                      0: pw.FlexColumnWidth(1.0),
                      1: pw.FlexColumnWidth(1.2),
                      2: pw.FlexColumnWidth(2.4),
                      3: pw.FlexColumnWidth(2.4),
                      4: pw.FlexColumnWidth(1.2),
                    },
                    children: [
                      pw.TableRow(
                        decoration: pw.BoxDecoration(color: PdfColor.fromInt(0xFFF8FAFC)),
                        children: [
                          pw.Padding(padding: pw.EdgeInsets.all(6), child: pw.Text('HSN/SAC', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
                          pw.Padding(padding: pw.EdgeInsets.all(6), child: pw.Text('TAXABLE VALUE', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
                          pw.Padding(
                            padding: pw.EdgeInsets.zero,
                            child: pw.Column(
                              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                              children: [
                                pw.Padding(padding: pw.EdgeInsets.all(4), child: pw.Text('CENTRAL TAX', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold))),
                                pw.Container(height: 1, color: PdfColor.fromHex("#CBD5E1")),
                                pw.Table(
                                  columnWidths: {0: pw.FlexColumnWidth(), 1: pw.FlexColumnWidth()},
                                  children: [
                                    pw.TableRow(
                                      children: [
                                        pw.Container(decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))), padding: pw.EdgeInsets.all(4), child: pw.Text('RATE', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold))),
                                        pw.Container(padding: pw.EdgeInsets.all(4), child: pw.Text('AMOUNT', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold))),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          pw.Padding(
                            padding: pw.EdgeInsets.zero,
                            child: pw.Column(
                              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                              children: [
                                pw.Padding(padding: pw.EdgeInsets.all(4), child: pw.Text('STATE TAX', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold))),
                                pw.Container(height: 1, color: PdfColor.fromHex("#CBD5E1")),
                                pw.Table(
                                  columnWidths: {0: pw.FlexColumnWidth(), 1: pw.FlexColumnWidth()},
                                  children: [
                                    pw.TableRow(
                                      children: [
                                        pw.Container(decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))), padding: pw.EdgeInsets.all(4), child: pw.Text('RATE', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold))),
                                        pw.Container(padding: pw.EdgeInsets.all(4), child: pw.Text('AMOUNT', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold))),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          pw.Padding(padding: pw.EdgeInsets.all(6), child: pw.Text('TOTAL TAX\nAMOUNT', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold))),
                        ],
                      ),
                      // Data Row
                      pw.TableRow(
                        children: [
                          _pdfSmallTd('998311', align: pw.TextAlign.center),
                          _pdfSmallTd(fmt.format(_servicePrice), align: pw.TextAlign.right),
                          pw.Table(columnWidths: {0: pw.FlexColumnWidth(), 1: pw.FlexColumnWidth()}, children: [pw.TableRow(children: [pw.Container(decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))), child: _pdfSmallTd('${(cgstRate*100).toStringAsFixed(0)}%', align: pw.TextAlign.center)), _pdfSmallTd(fmt.format(cgstAmount), align: pw.TextAlign.right)])]),
                          pw.Table(columnWidths: {0: pw.FlexColumnWidth(), 1: pw.FlexColumnWidth()}, children: [pw.TableRow(children: [pw.Container(decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))), child: _pdfSmallTd('${(sgstRate*100).toStringAsFixed(0)}%', align: pw.TextAlign.center)), _pdfSmallTd(fmt.format(sgstAmount), align: pw.TextAlign.right)])]),
                          _pdfSmallTd(fmt.format(cgstAmount + sgstAmount), align: pw.TextAlign.right),
                        ],
                      ),
                      // Total Row
                      pw.TableRow(
                        decoration: pw.BoxDecoration(color: PdfColor.fromInt(0xFFF8FAFC)),
                        children: [
                          _pdfSmallTd('TOTAL', align: pw.TextAlign.center, bold: true),
                          _pdfSmallTd(fmt.format(_servicePrice), align: pw.TextAlign.right, bold: true),
                          pw.Table(columnWidths: {0: pw.FlexColumnWidth(), 1: pw.FlexColumnWidth()}, children: [pw.TableRow(children: [pw.Container(decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))), child: _pdfSmallTd('—', align: pw.TextAlign.center, bold: true)), _pdfSmallTd(fmt.format(cgstAmount), align: pw.TextAlign.right, bold: true)])]),
                          pw.Table(columnWidths: {0: pw.FlexColumnWidth(), 1: pw.FlexColumnWidth()}, children: [pw.TableRow(children: [pw.Container(decoration: pw.BoxDecoration(border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1))), child: _pdfSmallTd('—', align: pw.TextAlign.center, bold: true)), _pdfSmallTd(fmt.format(sgstAmount), align: pw.TextAlign.right, bold: true)])]),
                          _pdfSmallTd(fmt.format(cgstAmount + sgstAmount), align: pw.TextAlign.right, bold: true),
                        ],
                      ),
                    ],
                  ),

                // FOOTER
                pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    // Bank Details
                    pw.Expanded(
                      flex: 6,
                      child: pw.Container(
                        padding: pw.EdgeInsets.all(12),
                        decoration: pw.BoxDecoration(
                          border: pw.Border(right: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1)),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text('BANK DETAILS:', style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563))),
                            pw.SizedBox(height: 6),
                            if (bankName.isNotEmpty) ...[
                              _pdfBankLine('Bank:', bankName),
                              _pdfBankLine('Account #:', accNo),
                              _pdfBankLine('IFSC:', ifsc),
                              _pdfBankLine('Branch:', branch),
                            ] else ...[
                              pw.Text('Bank details not configured.', style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF64748B))),
                            ],
                          ],
                        ),
                      ),
                    ),
                    // Signature
                    pw.Expanded(
                      flex: 4,
                      child: pw.Container(
                        padding: pw.EdgeInsets.all(12),
                        child: pw.Column(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: pw.CrossAxisAlignment.center,
                          children: [
                            pw.Text('For ${companyName.toUpperCase()}', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF374151))),
                            pw.SizedBox(height: 10),
                            signImage != null
                                ? pw.Image(signImage!, width: 60, height: 60, fit: pw.BoxFit.contain)
                                : pw.SizedBox(height: 60),
                            pw.SizedBox(height: 10),
                            pw.Text('Authorized Signatory', style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                
                // Notes and Terms
                pw.Table(
                  border: pw.TableBorder(
                    top: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                    verticalInside: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1.5),
                  ),
                  columnWidths: const {
                    0: pw.FlexColumnWidth(1),
                    1: pw.FlexColumnWidth(1),
                  },
                  children: [
                    pw.TableRow(
                      children: [
                        pw.Padding(
                          padding: pw.EdgeInsets.all(12),
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text('NOTES:', style: pw.TextStyle(fontSize: 6, color: const PdfColor.fromInt(0xFF475569))),
                              pw.SizedBox(height: 8),
                              pw.Text('Thank you for the Business', style: pw.TextStyle(fontSize: 6, color: const PdfColor.fromInt(0xFF475569))),
                            ],
                          ),
                        ),
                        pw.Padding(
                          padding: pw.EdgeInsets.all(12),
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text('TERMS AND CONDITIONS:', style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF475569))),
                              pw.SizedBox(height: 4),
                              pw.Text('1. Goods once sold cannot be taken back or exchanged.', style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF475569))),
                              pw.Text('2. We stand for warranty as per company terms.', style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF475569))),
                              pw.Text('3. Interest @24% p.a. charged after 15 days.', style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF475569))),
                              pw.Text('4. Subject to local Jurisdiction.', style: const pw.TextStyle(fontSize: 5, color: PdfColor.fromInt(0xFF475569))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

              ],
            ),
          );
        },
      ),
    );

    return pdf;
  }

  pw.Widget _pdfTh(String text) {
    return pw.Padding(
      padding: pw.EdgeInsets.all(6),
      child: pw.Text(text, textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 5, fontWeight: pw.FontWeight.bold)),
    );
  }

  pw.Widget _pdfTd(String text, {pw.TextAlign align = pw.TextAlign.left, bool bold = false}) {
    return pw.Padding(
      padding: pw.EdgeInsets.all(6),
      child: pw.Text(text, textAlign: align, style: pw.TextStyle(fontSize: 6, fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal)),
    );
  }

  pw.Widget _pdfSmallTd(String text, {pw.TextAlign align = pw.TextAlign.left, bool bold = false}) {
    return pw.Padding(
      padding: pw.EdgeInsets.all(4),
      child: pw.Text(text, textAlign: align, style: pw.TextStyle(fontSize: 7, fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal)),
    );
  }

  pw.Widget _pdfSummaryLine(String label, String value) {
    return pw.Container(
      padding: pw.EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: pw.BoxDecoration(
        border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromHex("#CBD5E1"), width: 1)),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 7)),
          pw.Text(value, style: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  pw.Widget _pdfBankLine(String label, String value) {
    return pw.Padding(
      padding: pw.EdgeInsets.only(bottom: 4),
      child: pw.Row(
        children: [
          pw.SizedBox(width: 70, child: pw.Text(label, style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: const PdfColor.fromInt(0xFF4B5563)))),
          pw.Text(value, style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  // Helper widgets for UI
  Widget _buildTh(String text) {
    return Padding(
      padding: const EdgeInsets.all(6),
      child: Text(text, textAlign: TextAlign.center, style: const TextStyle(fontSize: 5, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildTd(String text, {TextAlign align = TextAlign.left, bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.all(6),
      child: Text(text, textAlign: align, style: TextStyle(fontSize: 6, fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
    );
  }

  Widget _buildSmallTd(String text, {TextAlign align = TextAlign.left, bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.all(4),
      child: Text(text, textAlign: align, style: TextStyle(fontSize: 6, fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
    );
  }

  Widget _buildSummaryLine(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0xFFCBD5E1), width: 1))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 7)),
          Text(value, style: const TextStyle(fontSize: 7, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBankLine(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 6, fontWeight: FontWeight.bold, color: Color(0xFF4B5563)))),
          Text(value, style: const TextStyle(fontSize: 6, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Future<void> _shareOrDownloadPdf(BuildContext context, CompanySettings settings, double cgstRate, double sgstRate) async {
    try {
      final doc = await _buildPdf(settings, cgstRate, sgstRate);
      await Printing.sharePdf(bytes: await doc.save(), filename: 'Invoice_$_invoiceNumber.pdf');
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error generating PDF: $e')));
    }
  }
}
