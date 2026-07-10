import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/responsive.dart';
import 'service_detail_screen.dart';

class RegistrationServicesScreen extends StatefulWidget {
  final String initialCategory;
  const RegistrationServicesScreen({super.key, this.initialCategory = 'All'});

  @override
  State<RegistrationServicesScreen> createState() =>
      _RegistrationServicesScreenState();
}

class _RegistrationServicesScreenState
    extends State<RegistrationServicesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  late String _selectedCategory;

  final List<Map<String, dynamic>> _allPackages = [
    // --- Incorporation ---
    {
      'title': 'Private Limited Incorporation',
      'description': 'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA.',
      'icon': HugeIcons.strokeRoundedOffice,
      'color': const Color(0xFF6366F1),
      'category': 'Incorporation',
      'features': ['Name Reservation (RUN)', 'Digital Signature (DSC)', 'Director Identification (DIN)', 'MOA & AOA Drafting', 'Certificate of Incorporation'],
    },
    {
      'title': 'LLP Incorporation',
      'description': 'Statutory compliance for Limited Liability Partnerships.',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'color': const Color(0xFFF59E0B),
      'category': 'Incorporation',
      'features': ['Digital Signature Certificate (DSC)', 'Form 8 Statement of Account', 'Form 11 Annual Return', 'DIR-3 KYC of Partners', 'Income Tax Return Filing', 'LLP Agreement Maintenance'],
    },
    {
      'title': 'OPC',
      'description': 'One Person Company registration for solo entrepreneurs.',
      'icon': HugeIcons.strokeRoundedUser,
      'color': const Color(0xFF10B981),
      'category': 'Incorporation',
      'features': ['Name Reservation', 'DSC & DIN', 'MOA & AOA Drafting', 'Certificate of Incorporation', 'Bank Setup Support'],
    },
    {
      'title': 'Proprietorship',
      'description': 'Sole vendor formation with business identification.',
      'icon': HugeIcons.strokeRoundedUser,
      'color': const Color(0xFF3B82F6),
      'category': 'Incorporation',
      'features': ['Document support', 'MSME/Udyam Registration', 'GST Registration', 'Bank Account Assistance'],
    },
    {
      'title': 'MSME',
      'description': 'Official Udyam Registration for small and medium enterprises.',
      'icon': LucideIcons.medal,
      'color': const Color(0xFFF59E0B),
      'category': 'Incorporation',
      'features': ['Udyam Registration Certificate', 'Priority Sector Lending Support', 'Govt Subsidy Assistance', 'Collateral Free Loan Support', 'IP Reimbursement Advisory'],
    },

    // --- Compliance ---
    {
      'title': 'MCA Compliance',
      'description': 'Annual return filings and MCA statutory compliance.',
      'icon': HugeIcons.strokeRoundedTask01,
      'color': const Color(0xFF14B8A6),
      'category': 'Compliance',
      'features': ['Auditor appointment', '360° Accounting & Bookkeeping', 'Statutory Auditing', 'AOC 4 & MGT 7 filing', 'Director KYC', 'AGM & Notice', 'ITR filing'],
    },
    {
      'title': 'TDS',
      'description': 'TDS return filing and certificate issuance.',
      'icon': HugeIcons.strokeRoundedCalculator,
      'color': const Color(0xFF8B5CF6),
      'category': 'Compliance',
      'features': ['TDS Computation', 'Quarterly Return Filing', 'Form 16/16A Generation', 'Challan Payment', 'Notice Reply'],
    },
    {
      'title': 'PF',
      'description': 'Provident Fund registration and monthly compliance.',
      'icon': HugeIcons.strokeRoundedDocumentValidation,
      'color': const Color(0xFF3B82F6),
      'category': 'Compliance',
      'features': ['PF Registration', 'Monthly ECR Filing', 'Challan Generation', 'Employee Addition/Deletion', 'KYC Updates'],
    },

    // --- IP ---
    {
      'title': 'Trade Mark',
      'description': 'Brand protection and intellectual property rights.',
      'icon': HugeIcons.strokeRoundedTradeMark,
      'color': const Color(0xFFEC4899),
      'category': 'IP',
      'features': ['Trademark Search', 'Application Filing', 'Objection Handling', 'Hearing Support', 'Registration Certificate', 'Reimbursement Advisory'],
    },
    {
      'title': 'Copyright',
      'description': 'Protection for original creative literary or artistic works.',
      'icon': LucideIcons.copyright,
      'color': const Color(0xFF6366F1),
      'category': 'IP',
      'features': ['Diary Number Generation', 'Application Filing', 'Work Submission', 'Objection Reply', 'Copyright Certificate'],
    },
    {
      'title': 'Patent',
      'description': 'Exclusive rights for your inventions.',
      'icon': LucideIcons.lightbulb,
      'color': const Color(0xFFF59E0B),
      'category': 'IP',
      'features': ['Patent Search', 'Provisional Drafting', 'Complete Specification', 'Examination Reply', 'Patent Grant'],
    },

    // --- Tax ---
    {
      'title': 'GST Registration',
      'description': 'GST Registration for your business! Thank you for choosing Wealth Empires.',
      'icon': HugeIcons.strokeRoundedLicenseDraft,
      'color': const Color(0xFF10B981),
      'category': 'Tax',
      'features': ['GST Application Filing', 'Document Verification', 'ARN Generation', 'Clarification Support', 'GSTIN Certificate'],
    },
    {
      'title': 'GST filing',
      'description': 'Monthly/Quarterly GST returns and reconciliations.',
      'icon': HugeIcons.strokeRoundedCalculate,
      'color': const Color(0xFF3B82F6),
      'category': 'Tax',
      'features': ['GSTR-1 & 3B Filing', 'GSTR-2A/2B Reconciliation', 'Input Tax Credit (ITC)', 'Annual Return GSTR-9', 'Audit Support'],
    },
    {
      'title': 'GST Cancelation',
      'description': 'Surrender and cancel your GST registration.',
      'icon': LucideIcons.fileX,
      'color': const Color(0xFFEF4444),
      'category': 'Tax',
      'features': ['Application for Cancellation', 'Final Return GSTR-10', 'Reply to Notices', 'Assessment Clearance', 'Cancellation Order'],
    },
    {
      'title': 'ITR',
      'description': 'Income Tax Return filing for individuals and businesses.',
      'icon': 'assets/icons/itr.svg',
      'color': const Color(0xFF8B5CF6),
      'category': 'Tax',
      'features': ['Income Computation', 'Tax Saving Advisory', 'Return Filing (ITR 1-7)', 'Refund Tracking', 'Assessment Support'],
    },

    // --- Licensing ---
    {
      'title': 'DUNS',
      'description': 'Data Universal Numbering System for global business identity.',
      'icon': LucideIcons.globe,
      'color': const Color(0xFF10B981),
      'category': 'Licensing',
      'features': ['Global Business Identity Card', 'Mandatory Access to Tech Developer Programs', 'Creation of a Business Credit File', 'Global Vendor Onboarding (B2B Perks)', 'D&B Global Directory Listing'],
    },
    {
      'title': 'DPIIT',
      'description': 'Startup India Certification for your startup! Please provide your details correctly.',
      'icon': HugeIcons.strokeRoundedRocket,
      'color': const Color(0xFF10B981),
      'category': 'Licensing',
      'features': ['Pitch deck preparation', 'Tax Exemption Support', 'Priority Sector Lending Support', 'Government approval', 'IPR Fast Track'],
    },
    {
      'title': 'ISO',
      'description': 'Quality management certification (ISO 9001 and others).',
      'icon': LucideIcons.award,
      'color': const Color(0xFF14B8A6),
      'category': 'Licensing',
      'features': ['Process Audit', 'Quality Manual', 'Certification Support', 'Annual Surveillance', 'Training'],
    },
    {
      'title': 'BIS',
      'description': 'Bureau of Indian Standards product certification.',
      'icon': LucideIcons.shieldCheck,
      'color': const Color(0xFFF59E0B),
      'category': 'Licensing',
      'features': ['Product Testing', 'Factory Inspection', 'Application Filing', 'Grant of License', 'Renewal Support'],
    },
    {
      'title': 'CE & RoHS',
      'description': 'European standard certifications for electronics and products.',
      'icon': LucideIcons.checkCircle,
      'color': const Color(0xFF14B8A6),
      'category': 'Licensing',
      'features': ['Documentation Preparation', 'Testing Coordination', 'Compliance Audit', 'Declaration of Conformity', 'Certification Grant'],
    },
    {
      'title': 'FSSAI',
      'description': 'Registration for food business operators, manufacturers, and startups.',
      'icon': LucideIcons.utensils,
      'color': const Color(0xFF10B981),
      'category': 'Licensing',
      'features': ['Basic/State/Central License', 'Food Safety Audit', 'Premise Inspection Support', 'Renewal Reminders', 'Product Category Mapping'],
    },
    {
      'title': 'IE Code',
      'description': 'Import Export Code registration for cross-border trade.',
      'icon': LucideIcons.globe,
      'color': const Color(0xFF3B82F6),
      'category': 'Licensing',
      'features': ['Application Filing', 'DGFT Registration', 'Modification Support', 'Customs Clearance Help', 'IEC Certificate'],
    },
    {
      'title': 'LEI',
      'description': 'Legal Entity Identifier registration for financial transactions.',
      'icon': LucideIcons.barcode,
      'color': const Color(0xFF6366F1),
      'category': 'Licensing',
      'features': ['LEI Application', 'Global Directory Listing', 'Renewal Management', 'Data Validation', 'LEI Code Generation'],
    },

    {
      'title': 'DSC',
      'description': 'Digital Signature Certificate for individuals & organizations.',
      'icon': LucideIcons.usb,
      'color': const Color(0xFF8B5CF6),
      'category': 'Licensing',
      'features': ['Application Processing', 'Video Verification', 'KYC Verification', 'Token Procurement', '2-Year Validity'],
    }
  ];

  List<Map<String, dynamic>> get _filteredPackages {
    return _allPackages.where((package) {
      final matchesSearch =
          package['title'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
          package['description'].toLowerCase().contains(
            _searchQuery.toLowerCase(),
          );
      final matchesCategory =
          _selectedCategory == 'All' ||
          package['category'] == _selectedCategory;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text;
      });
    });
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Incorporation':
        return LucideIcons.building;
      case 'Compliance':
        return LucideIcons.fileCheck2;
      case 'IP':
        return LucideIcons.shieldCheck;
      case 'Tax':
        return LucideIcons.calculator;
      case 'Licensing':
        return LucideIcons.award;
      default:
        return LucideIcons.rocket;
    }
  }

  String _getCategoryTitle(String category) {
    if (category == 'All') return 'Registration Hub';
    return '$category Services';
  }

  String _getCategorySubtitle(String category) {
    switch (category) {
      case 'Incorporation':
        return 'Register your company and start your entrepreneurial journey.';
      case 'Compliance':
        return 'Stay compliant with annual filings and statutory requirements.';
      case 'IP':
        return 'Protect your brand, inventions, and creative works.';
      case 'Tax':
        return 'Manage GST, Income Tax, and other tax filings seamlessly.';
      case 'Licensing':
        return 'Obtain necessary licenses and certifications for your business.';
      default:
        return 'Launch and scale your business By Registering With Us..';
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Responsive.init(context);
    final filtered = _filteredPackages;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Header
          SliverAppBar(
            expandedHeight: 250.r,
            pinned: true,
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            backgroundColor: AppTheme.deepTeal,
            leading: Padding(
              padding: EdgeInsets.all(8.r),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withOpacity(0.15),
                    width: 1.0.r,
                  ),
                ),
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: Icon(
                    LucideIcons.arrowLeft,
                    color: Colors.white,
                    size: 20.ip,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.deepTeal,
                      AppTheme.corporateBlue.withOpacity(0.9),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24.r),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 50.r), // Top margin
                      Container(
                        padding: EdgeInsets.all(12.r),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(16.r),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 1.5.r,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Icon(
                          _getCategoryIcon(_selectedCategory),
                          color: Colors.white,
                          size: 28.ip,
                        ),
                      ),
                      SizedBox(height: 16.r),
                      Text(
                        _getCategoryTitle(_selectedCategory),
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 28.sp,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 6.r),
                      Text(
                        _getCategorySubtitle(_selectedCategory),
                        style: GoogleFonts.inter(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 13.sp,
                          fontWeight: FontWeight.w500,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 2. Search Integration
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(24.r, 24.r, 24.r, 16.r),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: 16.r,
                  vertical: 4.r,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16.r),
                  border: Border.all(
                    color: Colors.grey.withOpacity(0.2),
                    width: 1.0.r,
                  ),
                  boxShadow: AppTheme.softShadow,
                ),
                child: TextField(
                  controller: _searchController,
                  textAlignVertical: TextAlignVertical.center,
                  onTap: () {
                    if (_selectedCategory != 'All') {
                      setState(() {
                        _selectedCategory = 'All';
                      });
                    }
                  },
                  decoration: InputDecoration(
                    hintText: 'Search for Startup India services...',
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14.sp),
                    prefixIcon: Icon(LucideIcons.search, size: 20.ip),
                    prefixIconConstraints: BoxConstraints(minWidth: 40.r, minHeight: 40.r),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(LucideIcons.x, size: 16.ip),
                            onPressed: () => _searchController.clear(),
                          )
                        : null,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 12.r),
                  ),
                ),
              ),
            ),
          ),

          // 3. Category Chips
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: 24.r,
                    vertical: 8.r,
                  ),
                  child: Text(
                    'Popular Services',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontSize: 14.sp,
                    ),
                  ),
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 24.r),
                  child: Row(
                    children:
                        [
                          'All',
                          'Incorporation',
                          'Compliance',
                          'IP',
                          'Tax',
                          'Licensing',
                        ].map((label) {
                          return _ServiceChip(
                            label: label,
                            isActive: _selectedCategory == label,
                            onTap: () =>
                                setState(() => _selectedCategory = label),
                          );
                        }).toList(),
                  ),
                ),
                SizedBox(height: 32.r),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24.r),
                  child: Text(
                    '$_selectedCategory Results',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontSize: 14.sp,
                    ),
                  ),
                ),
                SizedBox(height: 16.r),
              ],
            ),
          ),

          // 4. List Results or Empty State
          if (filtered.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      LucideIcons.searchX,
                      size: 60.ip,
                      color: Colors.grey.withOpacity(0.3),
                    ),
                    SizedBox(height: 16.r),
                    Text(
                      'No matching packages in $_selectedCategory',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w600,
                        fontSize: 14.sp,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: EdgeInsets.symmetric(horizontal: 24.r),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final package = filtered[index];
                  return Padding(
                    padding: EdgeInsets.only(bottom: 16.r),
                    child: _ComplianceListCard(
                      title: package['title'],
                      description: package['description'],
                      icon: package['icon'],
                      color: package['color'],
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ServiceDetailScreen(
                              serviceName: package['title'],
                              icon: package['icon'],
                              description: package['description'],
                              features: List<String>.from(
                                package['features'] ?? [],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  );
                }, childCount: filtered.length),
              ),
            ),
          SliverToBoxAdapter(child: SizedBox(height: 40.r)),
        ],
      ),
    );
  }
}

class _ServiceChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _ServiceChip({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.only(right: 12.r),
        padding: EdgeInsets.symmetric(horizontal: 16.r, vertical: 10.r),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.deepTeal : Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isActive ? AppTheme.deepTeal : Colors.grey[200]!,
          ),
          boxShadow: isActive ? AppTheme.softShadow : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12.sp,
            color: isActive ? Colors.white : Colors.grey[600],
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}

class _ComplianceListCard extends StatelessWidget {
  final String title;
  final String description;
  final dynamic icon;
  final Color color;
  final VoidCallback onTap;

  const _ComplianceListCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        border: Border.all(
          color: AppTheme.deepTeal.withOpacity(0.08),
          width: 1.2.r,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24.r),
          child: Padding(
            padding: EdgeInsets.all(16.r),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(12.r),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  child: icon is String
                      ? SvgPicture.asset(icon as String, colorFilter: ColorFilter.mode(color, BlendMode.srcIn), width: 28.ip, height: 28.ip)
                      : icon is IconData
                          ? Icon(icon as IconData, color: color, size: 28.ip)
                          : HugeIcon(icon: icon, color: color, size: 28.ip),
                ),
                SizedBox(width: 16.r),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 14.sp,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.deepTeal,
                          height: 1.2,
                        ),
                      ),
                      SizedBox(height: 4.r),
                      Text(
                        description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 11.sp,
                          color: Colors.grey[600],
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 8.r),
                Icon(
                  LucideIcons.chevronRight,
                  color: Colors.grey[200],
                  size: 20.ip,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
