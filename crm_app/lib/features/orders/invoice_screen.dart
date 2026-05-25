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

  double get _servicePrice => _priceMap[order.serviceType] ?? 4999.00;

  static const _priceMap = {
    'Private Limited Incorporation': 12999.00,
    'GST Registration': 2499.00,
    'TDS Filing (Q4 2025-26)': 3499.00,
    'DSC Registration': 1999.00,
    'Annual ROC Filing': 5999.00,
    'Trademark Registration': 8999.00,
  };

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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 30,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Header section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(8),
                        topRight: Radius.circular(8),
                      ),
                      border: Border(
                        bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Left: Logo and Brand (Mirror PDF)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.asset(
                                    'assets/logo.jpg',
                                    height: 105,
                                    fit: BoxFit.contain,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            Text(
                                              'WEALTH EMPIRES',
                                              style: AppTheme.brandStyle
                                                  .copyWith(fontSize: 24),
                                            ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Global Business Excellence',
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: AppTheme.deepTeal.withOpacity(
                                          0.5,
                                        ),
                                        fontStyle: FontStyle.italic,
                                      ),
                                ),
                              ],
                            ),
                            // Right: Official Metadata (Mirror PDF)
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'INVOICE',
                                  style: AppTheme.brandStyle.copyWith(
                                    fontSize: 32,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                _metadataTextRow(context, 'Invoice No:', _invoiceNumber),
                                const SizedBox(height: 4),
                                _metadataTextRow(context, 'Date:', dateStr),
                                const SizedBox(height: 4),
                                _metadataTextRow(context, 'Payment:', 'UPI'),
                                const SizedBox(height: 16),
                                // PAID Badge
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.greenAccent.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: Colors.greenAccent.withOpacity(
                                        0.3,
                                      ),
                                    ),
                                  ),
                                  child: Text(
                                    'PAID',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelLarge
                                        ?.copyWith(
                                          color: Colors.greenAccent,
                                          letterSpacing: 1.5,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Content Section
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Billing Info
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Expanded(
                              child: _AddressBlock(
                                label: 'From',
                                name: 'Wealth Empires',
                                lines: [
                                  '60,A Velleeswarar koil street, Srinivasa Nagar',
                                  'Mangadu, Chennai, Tamil Nadu - 600122',
                                  'GSTIN: 33AAACW1234F1Z5',
                                ],
                              ),
                            ),
                            const SizedBox(width: 50),
                            Expanded(
                              child: _AddressBlock(
                                label: 'Billed To',
                                name: order.companyName,
                                lines: [order.entityName, 'India'],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // Line Items Table
                        _LineItemHeader(),
                        const SizedBox(height: 16),
                        _LineItem(
                          description: order.serviceType,
                          detail: 'Professional service fee',
                          amount: _servicePrice,
                        ),

                        const SizedBox(height: 24),
                        Container(
                          height: 1,
                          color: Colors.grey.withOpacity(0.1),
                        ),
                        const SizedBox(height: 16),

                        // Totals
                        _TotalRow(label: 'Subtotal', amount: _servicePrice),
                        const SizedBox(height: 12),
                        _TotalRow(
                          label: 'GST (18%)',
                          amount: _gst,
                          isGst: true,
                        ),
                        const SizedBox(height: 16),

                        // Final Amount
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF1F5F9)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total Paid',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              Text(
                                '₹${NumberFormat('#,##,##0.00').format(_total)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.deepTeal,
                                    ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        const SizedBox(height: 24),
                        Divider(color: Colors.grey.withOpacity(0.2)),
                        const SizedBox(height: 20),

                        // Footer (Mirror PDF)
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Verified & Handled by ${order.assignedExpert}',
                                style: Theme.of(context).textTheme.labelLarge
                                    ?.copyWith(
                                      color: Colors.grey.shade600,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Thank you for Choosing Wealth Empires!',
                                style: Theme.of(context).textTheme.bodyLarge
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.deepTeal,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'This is a system generated document. No physical signature required.',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(color: Colors.grey.shade400),
                              ),
                              const SizedBox(height: 24),
                              Container(
                                height: 4,
                                width: 40,
                                decoration: BoxDecoration(
                                  color: AppTheme.deepTeal,
                                  borderRadius: BorderRadius.circular(2),
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

            const SizedBox(height: 20),

            // Action Buttons
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
        Text(
          value,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
            fontWeight: FontWeight.w800,
            color: AppTheme.deepTeal,
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
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            fontWeight: FontWeight.w800,
            color: Colors.grey.shade400,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w900,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 4),
        ...lines.map(
          (l) => Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              l,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade500,
                height: 1.4,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _LineItemHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 5,
          child: Text(
            'SERVICE DESCRIPTION',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: Colors.black,
              letterSpacing: 1,
            ),
          ),
        ),
        Text(
          'AMOUNT',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: 1,
          ),
        ),
      ],
    );
  }
}

class _LineItem extends StatelessWidget {
  final String description;
  final String detail;
  final double amount;
  const _LineItem({
    required this.description,
    required this.detail,
    required this.amount,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 5,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                description,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                detail,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade800),
              ),
            ],
          ),
        ),
        Text(
          '₹${NumberFormat('#,##,##0.00').format(amount)}',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: Colors.black,
          ),
        ),
      ],
    );
  }
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
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: isGst
                ? Colors.grey.shade500
                : AppTheme.deepTeal.withOpacity(0.7),
          ),
        ),
        Text(
          '₹${NumberFormat('#,##,##0.00').format(amount)}',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: isGst ? Colors.grey.shade700 : AppTheme.deepTeal,
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
          borderRadius: BorderRadius.circular(20),
          border: isPrimary
              ? null
              : Border.all(color: AppTheme.deepTeal.withOpacity(0.2)),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: AppTheme.deepTeal.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
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
