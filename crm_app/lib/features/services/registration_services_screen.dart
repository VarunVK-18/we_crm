import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/responsive.dart';
import 'service_detail_screen.dart';

class RegistrationServicesScreen extends StatefulWidget {
  const RegistrationServicesScreen({super.key});

  @override
  State<RegistrationServicesScreen> createState() =>
      _RegistrationServicesScreenState();
}

class _RegistrationServicesScreenState
    extends State<RegistrationServicesScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All'; // Default to All

  // Master list of packages with category mapping
  final List<Map<String, dynamic>> _allPackages = [
    {
      'title': 'MCA Compliance Package (Private Ltd)',
      'description':
          'Full MCA lifecycle management for private limited entities including all mandatory annual and one-time filings.',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'color': const Color(0xFF6366F1),
      'category': 'Compliance Services',
      'features': [
        'INC-20A Commencement of Business',
        'AOC-4 Annual Return Filing',
        'MGT-7A Annual Return (XBRL)',
        'DPT-3 Return of Deposits',
        'DIR-3 KYC of Directors',
        'ADT-1 Auditor Appointment',
      ],
    },
    {
      'title': 'GST Compliance Package',
      'description':
          'End-to-end GST filing (GSTR-1, 3B, 9) and expert advisory for tax optimization.',
      'icon': HugeIcons.strokeRoundedFile02,
      'color': const Color(0xFF10B981),
      'category': 'Compliance Services',
      'features': [
        'Monthly GSTR-1 & 3B Filing',
        'Annual GSTR-9 Return',
        'Tax Credit Reconciliation',
        'Input Tax Credit (ITC) Audit',
        'GST Department Query Support',
      ],
    },
    {
      'title': 'MCA Compliance Package (LLP)',
      'description':
          'Statutory compliance for Limited Liability Partnerships including Form 8 and Form 11.',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'color': const Color(0xFFF59E0B),
      'category': 'Compliance Services',
      'features': [
        'Form 8 Statement of Account',
        'Form 11 Annual Return',
        'DIR-3 KYC of Partners',
        'Income Tax Return Filing',
        'LLP Agreement Maintenance',
      ],
    },
    {
      'title': 'Compliance Audit',
      'description':
          'Ensure your business complies with all statutory regulations through our comprehensive audit, risk identification, and rectification support.',
      'icon': HugeIcons.strokeRoundedTask01,
      'color': const Color(0xFF10B981),
      'category': 'Compliance Services',
      'features': [
        'Statutory Compliance Audit',
        'Operational Risk Assessment',
        'Filing Gap Analysis',
        'Detailed Compliance Report',
        'Expert Remediation Advisory',
      ],
    },
    {
      'title': 'Proprietorship Registration',
      'description':
          'Sole vendor formation with business identification and MSME certification.',
      'icon': HugeIcons.strokeRoundedUser,
      'color': const Color(0xFF3B82F6),
      'category': 'Company Incorporation',
      'features': [
        'PAN Card Application',
        'MSME/Udyam Registration',
        'GST Registration',
        'Bank Account Assistance',
        'Trade License Support',
      ],
    },
    {
      'title': 'Partnership Firm Registration',
      'description':
          'Legal drafting and registration for business partners under Indian Partnership Act.',
      'icon': HugeIcons.strokeRoundedUser,
      'color': const Color(0xFFEC4899),
      'category': 'Company Incorporation',
      'features': [
        'Drafting Partnership Deed',
        'Deed Notarization',
        'Firm Registration (ROF)',
        'PAN & TAN Application',
        'Trade License',
      ],
    },

    {
      'title': 'IEC Code Registration',
      'description':
          'Import Export Code for expanding global trade and DGFT compliance.',
      'icon': LucideIcons.globe,
      'color': const Color(0xFF14B8A6),
      'category': 'Business Licenses',
      'features': [
        'DGFT Application Filing',
        'E-IEC Certificate',
        'RCMC Membership Support',
        'Export Incentive Advisory',
        'Port Registration Advice',
      ],
    },
    {
      'title': 'Comprehensive MCA + GST + TDS',
      'description':
          'All-in-one statutory, tax, and withholding compliance bundle for startups.',
      'icon': LucideIcons.layers,
      'color': const Color(0xFF3B82F6),
      'category': 'Compliance Services',
      'features': [
        'All MCA Annual Filings',
        'Monthly GST Compliance',
        'Quarterly TDS Returns',
        'Income Tax Audit Support',
        'Dedicated Compliance Manager',
      ],
    },
    {
      'title': 'FSSAI Food License',
      'description':
          'Registration for food business operators, manufacturers, and startups.',
      'icon': LucideIcons.utensils,
      'color': const Color(0xFF10B981),
      'category': 'Business Licenses',
      'features': [
        'Basic/State/Central License',
        'Food Safety Audit',
        'Premise Inspection Support',
        'Renewal Reminders',
        'Product Category Mapping',
      ],
    },
    {
      'title': 'MSME Certification',
      'description':
          'Official Udyam Registration for small and medium enterprises to unlock government benefits.',
      'icon': LucideIcons.medal,
      'color': const Color(0xFFF59E0B),
      'category': 'Business Licenses',
      'features': [
        'Udyam Registration Certificate',
        'Priority Sector Lending Support',
        'Govt Subsidy Assistance',
        'Collateral Free Loan Support',
        'ISO Reimbursement Advisory',
      ],
    },
    {
      'title': 'DUNS Number Registration',
      'description':
          'Global business identification number for international credit and partnership credibility.',
      'icon': LucideIcons.shieldCheck,
      'color': const Color(0xFF3B82F6),
      'category': 'Business Licenses',
      'features': [
        'DUNS Number Assignment',
        'International Credit Credibility',
        'Supply Chain Compliance',
        'Verified Business Profile',
        'Universal Business Language',
      ],
    },
    {
      'title': 'TAX filing',
      'description': 'Preparing and submitting your income tax returns (ITR)',
      'icon': HugeIcons.strokeRoundedFile02,
      'color': const Color.fromARGB(255, 144, 17, 135),
      'category': 'Taxation Services',
      'features': [
        'Basic/State/Central License',
        'Food Safety Audit',
        'Premise Inspection Support',
        'Renewal Reminders',
        'Product Category Mapping',
      ],
    },
    {
      'title': 'TAX Planning',
      'description':
          'Helping you reduce tax legally, Suggesting investments like ELSS, insurance,etc..',
      'icon': HugeIcons.strokeRoundedTask01,
      'color': const Color.fromARGB(255, 5, 213, 26),
      'category': 'Taxation Services',
      'features': [
        'Basic/State/Central License',
        'Food Safety Audit',
        'Premise Inspection Support',
        'Renewal Reminders',
        'Product Category Mapping',
      ],
    },
    {
      'title': 'GST Services',
      'description': 'GST registration, GST return filing, GST cancellation',
      'icon': HugeIcons.strokeRoundedDocumentValidation,
      'color': const Color.fromARGB(255, 188, 188, 6),
      'category': 'Taxation Services',
      'features': [
        'Basic/State/Central License',
        'Food Safety Audit',
        'Premise Inspection Support',
        'Renewal Reminders',
        'Product Category Mapping',
      ],
    },
    {
      'title': 'Private Limited Incorporation',
      'description':
          'Full-scale incorporation service including name reservation, DSC, DIN, MOA/AOA drafting, and COI issuance.',
      'icon': HugeIcons.strokeRoundedOffice,
      'color': const Color.fromARGB(255, 85, 97, 237),
      'category': 'Company Incorporation',
      'features': [
        'Name Reservation (RUN)',
        'Digital Signature (DSC)',
        'Director Identification (DIN)',
        'MOA & AOA Drafting',
        'Certificate of Incorporation',
      ],
    },
    {
      'title': 'LLP Incorporation',
      'description':
          'Limited Liability Partnership formation including name reservation, DSC, and LLP agreement drafting.',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'color': const Color(0xFFF59E0B),
      'category': 'Company Incorporation',
      'features': [
        'LLP Name Reservation',
        'Partners DSC Application',
        'Drafting LLP Agreement',
        'Form 1 & Form 2 Filing',
        'PAN & TAN for LLP',
      ],
    },
    {
      'title': 'PAN, TAN & Bamk Setup',
      'description': 'Apply For Company PAN, TAN & Open Bank Accounts',
      'icon': LucideIcons.banknote,
      'color': const Color.fromARGB(255, 25, 173, 178),
      'category': 'Company Incorporation',
      'features': [
        'Basic/State/Central License',
        'Food Safety Audit',
        'Premise Inspection Support',
        'Renewal Reminders',
        'Product Category Mapping',
      ],
    },
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
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text;
      });
    });
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
                          LucideIcons.rocket,
                          color: Colors.white,
                          size: 28.ip,
                        ),
                      ),
                      SizedBox(height: 16.r),
                      Text(
                        'Registration Hub',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 28.sp,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 6.r),
                      Text(
                        'Launch and scale your business with official registration tools.',
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
                  boxShadow: AppTheme.softShadow,
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search for Startup India services...',
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14.sp),
                    prefixIcon: Icon(LucideIcons.search, size: 20.ip),
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
                          'Company Incorporation',
                          'Compliance Services',
                          'Business Licenses',
                          'Taxation Services',
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
                  child: icon is IconData
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
