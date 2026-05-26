import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../core/theme/app_theme.dart';
import '../../models/order_model.dart';

// ─── Invoice Screen ───────────────────────────────────────────────────────────

class InvoiceScreen extends StatelessWidget {
  final ServiceOrder order;
  const InvoiceScreen({super.key, required this.order});

  // Mock invoice data — replace with real fields from backend later
  String get _invoiceNumber =>
      'INV-${order.id.replaceAll('ORD-', '').padLeft(4, '0')}';

  // Fetch deal closed amount directly from the order
  double get _servicePrice =>
      order.dealClosedAmount > 0 ? order.dealClosedAmount : 4999.00;

  double get _gst => _servicePrice * 0.18;
  double get _total => _servicePrice + _gst;

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd MMM yyyy').format(order.createdAt);
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            LucideIcons.arrowLeft,
            color: AppTheme.deepTeal,
            size: 20,
          ),
        ),
        title: Text(
          'Digital Invoice',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        actions: [
          IconButton(
            onPressed: () => _shareOrDownloadPdf(context),
            icon: const Icon(
              LucideIcons.share2,
              color: AppTheme.deepTeal,
              size: 20,
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // The Invoice Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: const BoxDecoration(
                      color: AppTheme.deepTeal,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Left: Logo placeholder / Brand name
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.asset(
                                  'assets/logo.jpg',
                                  height: 60,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) =>
                                      Text(
                                    'WEALTH EMPIRES',
                                    style: AppTheme.brandStyle.copyWith(
                                      fontSize: 20,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Global Business Excellence',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.7),
                                  fontSize: 10,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Right: Title
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'INVOICE',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 2,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color:
                                    Colors.greenAccent.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: Colors.greenAccent),
                              ),
                              child: const Text(
                                'PAID',
                                style: TextStyle(
                                  color: Colors.greenAccent,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Metadata Ribbon
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      border: Border(
                          bottom: BorderSide(color: Colors.grey.shade200)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _MetaItem(label: 'Invoice No.', value: _invoiceNumber),
                        _MetaItem(label: 'Date', value: dateStr),
                        _MetaItem(label: 'Payment', value: 'UPI'),
                      ],
                    ),
                  ),

                  // Content Body
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Addresses
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Expanded(
                              child: _AddressBlock(
                                label: 'From',
                                name: 'Wealth Empires',
                                lines: [
                                  '60, A Velleeswarar koil st',
                                  'Srinivasa Nagar, Mangadu',
                                  'Chennai, TN 600122',
                                  'GST: 33AAACW1234F1Z5',
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: _AddressBlock(
                                label: 'Billed To',
                                name: order.companyName,
                                lines: [order.entityName, 'India'],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 32),

                        // Line Items Table
                        _LineItemTable(
                          serviceType: order.serviceType,
                          amount: _servicePrice,
                        ),

                        const SizedBox(height: 24),

                        // Totals Calculation
                        Align(
                          alignment: Alignment.centerRight,
                          child: SizedBox(
                            width: 200,
                            child: Column(
                              children: [
                                _TotalRow(
                                    label: 'Subtotal', amount: _servicePrice),
                                const SizedBox(height: 8),
                                _TotalRow(
                                    label: 'CGST (9%)',
                                    amount: _servicePrice * 0.09,
                                    isGst: true),
                                const SizedBox(height: 8),
                                _TotalRow(
                                    label: 'SGST (9%)',
                                    amount: _servicePrice * 0.09,
                                    isGst: true),
                                const SizedBox(height: 12),
                                const Divider(),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Total Paid',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.deepTeal,
                                          ),
                                    ),
                                    Text(
                                      '₹${NumberFormat('#,##,##0.00').format(_total)}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleLarge
                                          ?.copyWith(
                                            fontWeight: FontWeight.w900,
                                            color: AppTheme.deepTeal,
                                          ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        // Footer
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Verified & Handled by ${order.assignedExpert}',
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Thank you for choosing Wealth Empires!',
                                style: TextStyle(
                                  color: AppTheme.deepTeal,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'System generated document. No signature required.',
                                style: TextStyle(
                                  color: Colors.grey.shade400,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Action Button
            _ActionButton(
              icon: LucideIcons.download,
              label: 'Download Official PDF',
              onTap: () => _downloadPdf(context),
              isPrimary: true,
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ── PDF Generation Logic ──────────────────────────────────────────────────

  Future<pw.Document> _buildPdf() async {
    final pdf = pw.Document();

    // Load Unicode support fonts for Indian Rupee symbol
    final font = await PdfGoogleFonts.notoSansRegular();
    final fontBold = await PdfGoogleFonts.notoSansBold();

    // Load Logo from Assets
    pw.MemoryImage? logoImage;
    try {
      final logoData = await rootBundle.load('assets/logo.jpg');
      logoImage = pw.MemoryImage(
        logoData.buffer.asUint8List(
          logoData.offsetInBytes,
          logoData.lengthInBytes,
        ),
      );
    } catch (e) {
      debugPrint('Error loading logo: $e');
    }

    final dateStr = DateFormat('dd MMM yyyy').format(order.createdAt);
    final fmt = NumberFormat('#,##,##0.00');

    // Define Colors from UI
    final deepTeal = PdfColor.fromHex('#0D1B1E');
    final secondaryGrey = PdfColor.fromHex('#64748B');
    final borderLight = PdfColor.fromHex('#CBD5E1');
    final tableHeaderBg = PdfColor.fromHex('#F1F5F9');

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        theme: pw.ThemeData.withFont(base: font, bold: fontBold),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // ── Top Header Section (Rebalanced) ────────────────────────────
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // Left: Logo
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      if (logoImage != null)
                        pw.Container(height: 115, child: pw.Image(logoImage))
                      else
                        pw.Text(
                          'WEALTH EMPIRES',
                          style: pw.TextStyle(
                            fontSize: 38,
                            fontWeight: pw.FontWeight.bold,
                            color: deepTeal,
                            letterSpacing: 1.5,
                          ),
                        ),
                      pw.SizedBox(height: 5),
                      pw.Text(
                        'Global Business Excellence',
                        style: pw.TextStyle(
                          fontSize: 11,
                          color: secondaryGrey,
                          fontStyle: pw.FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                  // Right: Invoice Metadata
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        'INVOICE',
                        style: pw.TextStyle(
                          fontSize: 25,
                          fontWeight: pw.FontWeight.bold,
                          color: deepTeal,
                          letterSpacing: 2,
                        ),
                      ),
                      pw.SizedBox(height: 8),
                      _pdfMetadataRow('Invoice No:', _invoiceNumber, deepTeal),
                      _pdfMetadataRow('Date:', dateStr, deepTeal),
                      _pdfMetadataRow('Payment Method:', 'UPI', deepTeal),
                      pw.SizedBox(height: 12),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: pw.BoxDecoration(
                          color: const PdfColor.fromInt(0xFFE8F5E9),
                          borderRadius: pw.BorderRadius.circular(4),
                          border: pw.Border.all(
                            color: const PdfColor.fromInt(0xFFC8E6C9),
                          ),
                        ),
                        child: pw.Text(
                          'PAID',
                          style: pw.TextStyle(
                            color: const PdfColor.fromInt(0xFF2E7D32),
                            fontSize: 10,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 48),

              // ── Billing Section ────────────────────────────────────────────
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Expanded(
                    child: _pdfAddressBlock(
                      label: 'From',
                      name: 'Wealth Empires',
                      lines: [
                        '60,A Velleeswarar koil street, Srinivasa Nagar',
                        'Mangadu, Chennai, Tamil Nadu - 600122',
                        'GSTIN: 33AAACW1234F1Z5',
                      ],
                      secondaryGrey: secondaryGrey,
                      deepTeal: deepTeal,
                    ),
                  ),
                  pw.SizedBox(width: 50),
                  pw.Expanded(
                    child: _pdfAddressBlock(
                      label: 'Billed To',
                      name: order.companyName,
                      lines: [order.entityName, 'India'],
                      secondaryGrey: secondaryGrey,
                      deepTeal: deepTeal,
                    ),
                  ),
                ],
              ),

              pw.SizedBox(height: 48),

              // ── Tabular Service Section ────────────────────────────────────
              pw.Table(
                border: pw.TableBorder.all(color: borderLight, width: 0.5),
                columnWidths: {
                  0: const pw.FlexColumnWidth(5),
                  1: const pw.FixedColumnWidth(60),
                  2: const pw.FixedColumnWidth(80),
                  3: const pw.FixedColumnWidth(100),
                },
                children: [
                  // Table Header
                  pw.TableRow(
                    decoration: pw.BoxDecoration(color: tableHeaderBg),
                    children: [
                      _pdfTableCell('Item Description', isHeader: true),
                      _pdfTableCell(
                        'Qty',
                        isHeader: true,
                        align: pw.TextAlign.center,
                      ),
                      _pdfTableCell(
                        'Rate',
                        isHeader: true,
                        align: pw.TextAlign.right,
                      ),
                      _pdfTableCell(
                        'Amount',
                        isHeader: true,
                        align: pw.TextAlign.right,
                      ),
                    ],
                  ),
                  // Service Item
                  pw.TableRow(
                    children: [
                      _pdfTableCell(
                        '${order.serviceType}\nProfessional consultancy fee',
                        isHeader: false,
                        padding: 12,
                      ),
                      _pdfTableCell(
                        '1',
                        isHeader: false,
                        align: pw.TextAlign.center,
                      ),
                      _pdfTableCell(
                        '₹${fmt.format(_servicePrice)}',
                        isHeader: false,
                        align: pw.TextAlign.right,
                      ),
                      _pdfTableCell(
                        '₹${fmt.format(_servicePrice)}',
                        isHeader: false,
                        align: pw.TextAlign.right,
                      ),
                    ],
                  ),
                ],
              ),

              pw.SizedBox(height: 32),

              // ── Financial Totals ───────────────────────────────────────────
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.SizedBox(
                    width: 220,
                    child: pw.Column(
                      children: [
                        _pdfTotalRow(
                          'Subtotal',
                          _servicePrice,
                          fmt,
                          secondaryGrey,
                        ),
                        pw.SizedBox(height: 6),
                        _pdfTotalRow(
                          'CGST (9%)',
                          _servicePrice * 0.09,
                          fmt,
                          secondaryGrey,
                        ),
                        pw.SizedBox(height: 6),
                        _pdfTotalRow(
                          'SGST (9%)',
                          _servicePrice * 0.09,
                          fmt,
                          secondaryGrey,
                        ),
                        pw.Divider(color: borderLight, thickness: 1),
                        pw.SizedBox(height: 8),
                        // Grand Total Highlight
                        pw.Container(
                          padding: const pw.EdgeInsets.all(12),
                          decoration: pw.BoxDecoration(
                            color: deepTeal,
                            borderRadius: pw.BorderRadius.circular(10),
                          ),
                          child: pw.Row(
                            mainAxisAlignment:
                                pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text(
                                'Total Paid',
                                style: pw.TextStyle(
                                  color: PdfColors.white,
                                  fontSize: 12,
                                  fontWeight: pw.FontWeight.bold,
                                ),
                              ),
                              pw.Text(
                                '₹${fmt.format(_total)}',
                                style: pw.TextStyle(
                                  color: PdfColors.white,
                                  fontSize: 14,
                                  fontWeight: pw.FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 40),

              // ── Footer ─────────────────────────────────────────────────────
              pw.Center(
                child: pw.Column(
                  children: [
                    pw.Text(
                      'Verified & Handled by ${order.assignedExpert}',
                      style: pw.TextStyle(
                        fontSize: 10,
                        color: secondaryGrey,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 24),
                    pw.Text(
                      'Thank you for Choosing Wealth Empires!',
                      style: pw.TextStyle(
                        fontSize: 12,
                        fontWeight: pw.FontWeight.bold,
                        color: deepTeal,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'This is a system generated document. No physical signature required.',
                      style: pw.TextStyle(fontSize: 8, color: secondaryGrey),
                    ),
                    pw.SizedBox(height: 20),
                    pw.Container(
                      height: 4,
                      width: 40,
                      decoration: pw.BoxDecoration(
                        color: deepTeal,
                        borderRadius: pw.BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    return pdf;
  }

  // ── PDF Helper Widgets ─────────────────────────────────────────────────────

  pw.Widget _pdfMetadataRow(String label, String value, PdfColor color) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 2),
      child: pw.Row(
        mainAxisSize: pw.MainAxisSize.min,
        children: [
          pw.Text(
            label,
            style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600),
          ),
          pw.SizedBox(width: 8),
          pw.Text(
            value,
            style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _pdfAddressBlock({
    required String label,
    required String name,
    required List<String> lines,
    required PdfColor secondaryGrey,
    required PdfColor deepTeal,
  }) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          label.toUpperCase(),
          style: pw.TextStyle(
            fontSize: 9,
            fontWeight: pw.FontWeight.bold,
            color: secondaryGrey,
            letterSpacing: 1.2,
          ),
        ),
        pw.SizedBox(height: 8),
        pw.Text(
          name,
          style: pw.TextStyle(
            fontSize: 12,
            fontWeight: pw.FontWeight.bold,
            color: deepTeal,
          ),
        ),
        pw.SizedBox(height: 4),
        ...lines.map(
          (l) => pw.Padding(
            padding: const pw.EdgeInsets.only(top: 2),
            child: pw.Text(
              l,
              style: pw.TextStyle(
                fontSize: 10,
                color: secondaryGrey,
                lineSpacing: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  pw.Widget _pdfTableCell(
    String text, {
    required bool isHeader,
    pw.TextAlign align = pw.TextAlign.left,
    double padding = 8,
  }) {
    return pw.Padding(
      padding: pw.EdgeInsets.all(padding),
      child: pw.Text(
        text,
        textAlign: align,
        style: pw.TextStyle(
          fontSize: isHeader ? 9 : 10,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: PdfColors.black,
        ),
      ),
    );
  }

  pw.Widget _pdfTotalRow(
    String label,
    double amount,
    NumberFormat fmt,
    PdfColor color,
  ) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(label, style: pw.TextStyle(fontSize: 10, color: color)),
        pw.Text(
          '₹${fmt.format(amount)}',
          style: pw.TextStyle(
            fontSize: 10,
            fontWeight: pw.FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _metadataTextRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppTheme.deepTeal,
                ),
          ),
        ),
      ],
    );
  }

  Future<void> _downloadPdf(BuildContext context) async {
    final pdf = await _buildPdf();
    await Printing.layoutPdf(
      onLayout: (_) async => pdf.save(),
      name: '$_invoiceNumber.pdf',
    );
  }

  Future<void> _shareOrDownloadPdf(BuildContext context) async {
    final pdf = await _buildPdf();
    await Printing.sharePdf(
      bytes: await pdf.save(),
      filename: '$_invoiceNumber.pdf',
    );
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _MetaItem extends StatelessWidget {
  final String label;
  final String value;
  const _MetaItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.grey.shade500,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppTheme.deepTeal,
          ),
        ),
      ],
    );
  }
}

class _AddressBlock extends StatelessWidget {
  final String label;
  final String name;
  final List<String> lines;
  const _AddressBlock({
    required this.label,
    required this.name,
    required this.lines,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Colors.grey.shade400,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: AppTheme.deepTeal,
          ),
        ),
        const SizedBox(height: 4),
        ...lines.map(
          (l) => Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              l,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _LineItemTable extends StatelessWidget {
  final String serviceType;
  final double amount;
  const _LineItemTable({required this.serviceType, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text('DESCRIPTION', style: _headerStyle),
                ),
                Expanded(
                  flex: 1,
                  child: Text('QTY',
                      textAlign: TextAlign.center, style: _headerStyle),
                ),
                Expanded(
                  flex: 2,
                  child: Text('AMOUNT',
                      textAlign: TextAlign.right, style: _headerStyle),
                ),
              ],
            ),
          ),
          // Item
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        serviceType,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: AppTheme.deepTeal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Professional consultancy fee',
                        style: TextStyle(
                            fontSize: 11, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Text(
                    '1',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    '₹${NumberFormat('#,##,##0.00').format(amount)}',
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.deepTeal,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  TextStyle get _headerStyle => TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        color: Colors.grey.shade500,
        letterSpacing: 0.5,
      );
}

class _TotalRow extends StatelessWidget {
  final String label;
  final double amount;
  final bool isGst;
  const _TotalRow({
    required this.label,
    required this.amount,
    this.isGst = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isGst ? Colors.grey.shade500 : Colors.grey.shade700,
          ),
        ),
        Text(
          '₹${NumberFormat('#,##,##0.00').format(amount)}',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: isGst ? Colors.grey.shade600 : AppTheme.deepTeal,
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isPrimary;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.isPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: isPrimary ? AppTheme.deepTeal : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: isPrimary
              ? null
              : Border.all(color: AppTheme.deepTeal.withOpacity(0.2)),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: AppTheme.deepTeal.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isPrimary ? Colors.white : AppTheme.deepTeal,
              size: 20,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: isPrimary ? Colors.white : AppTheme.deepTeal,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
