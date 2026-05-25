import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/responsive.dart';
import 'service_detail_screen.dart';

class ServiceSelectionScreen extends StatefulWidget {
  const ServiceSelectionScreen({super.key});

  @override
  State<ServiceSelectionScreen> createState() => _ServiceSelectionScreenState();
}

class _ServiceSelectionScreenState extends State<ServiceSelectionScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All';

  // Master list of services with category tags
  final List<Map<String, dynamic>> _allServices = [
    {
      'title': '360° Compliance',
      'subtitle': 'Statutory & regulatory lifecycle management',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'color': const Color(0xFF6366F1),
      'category': 'Legal',
      'description':
          'End-to-end statutory and regulatory lifecycle management to ensure your business stays 100% compliant with changing laws.',
      'features': [
        'Annual Filing Support',
        'Regulatory Impact Analysis',
        'Compliance Health Check',
        'Direct Access to Legal Experts',
        'Automated Deadlines & Alerts',
      ],
    },
    {
      'title': 'Trademark Registration',
      'subtitle': 'Comprehensive brand & IP protection',
      'icon': HugeIcons.strokeRoundedLicense,
      'color': const Color(0xFFF59E0B),
      'category': 'Legal',
      'description':
          'Protect your unique brand identity and intellectual property with our comprehensive trademark filing and monitoring services.',
      'features': [
        'Trademark Search & Availability',
        'Application Filing & Tracking',
        'Opposition Handling',
        'Renewal & Maintenance',
        'IP Infringement Protection',
      ],
    },
    {
      'title': 'Company Incorporation',
      'subtitle': 'Scalable entity formation & legal structure',
      'icon': HugeIcons.strokeRoundedOffice,
      'color': const Color(0xFF10B981),
      'category': 'Business',
      'description':
          'Fast and reliable legal entity formation. We handle the paperwork so you can focus on building your business.',
      'features': [
        'MOA & AOA Drafting',
        'DIN & DSC Acquisition',
        'PAN & TAN Registration',
        'Certificate of Incorporation',
        'Bank Account Setup Support',
      ],
    },
    {
      'title': 'Accounting & Tax',
      'subtitle': 'Enterprise financial reporting & audits',
      'icon': HugeIcons.strokeRoundedCalculator,
      'color': const Color(0xFF3B82F6),
      'category': 'Tax',
      'description':
          'Accurate financial reporting and strategic tax planning to help you optimize your enterprise wealth and transparency.',
      'features': [
        'Bookkeeping & Accounting',
        'Internal & Statutory Audits',
        'Corporate Tax Computation',
        'TDS & Withholding Support',
        'Financial Health Dashboards',
      ],
    },
    {
      'title': 'GST Onboarding',
      'subtitle': 'Tax identification & monthly filing',
      'icon': HugeIcons.strokeRoundedFile02,
      'color': const Color(0xFF8B5CF6),
      'category': 'Tax',
      'description':
          'Seamless GST registration and monthly compliance management, ensuring timely filings and maximum input credit.',
      'features': [
        'New GST Registration',
        'Monthly GSTR-1 & 3B Returns',
        'Annual Reconciliation',
        'GST Refund Processing',
        'Departmental Notice Support',
      ],
    },
    {
      'title': 'Strategic Tax Planning',
      'subtitle': 'Wealth optimization & compliance strategy',
      'icon': HugeIcons.strokeRoundedPercentCircle,
      'color': const Color(0xFFEC4899),
      'category': 'Tax',
      'description':
          'Expert advisory on wealth optimization and compliance strategy to minimize tax liabilities while maximizing legal safety.',
      'features': [
        'Advanced Tax Structuring',
        'Wealth Growth Strategy',
        'Estate Planning Advice',
        'International Tax Advisory',
        'Investment Compliance Audit',
      ],
    },
    {
      'title': 'ISO Certifications',
      'subtitle': 'International quality standard audit',
      'icon': HugeIcons.strokeRoundedDocumentValidation,
      'color': const Color(0xFF06B6D4),
      'category': 'Legal',
      'description':
          'Verify your business quality and international standards with our end-to-end ISO certification and audit support.',
      'features': [
        'Gap Analysis Audit',
        'Documentation Support',
        'Internal Auditor Training',
        'External Audit Assistance',
        'Global Quality Badge Acquisition',
      ],
    },
    {
      'title': 'Capital Funding',
      'subtitle': 'Growth advisory & investor relations',
      'icon': HugeIcons.strokeRoundedInvoice02,
      'color': const Color(0xFFF43F5E),
      'category': 'Business',
      'description':
          'Bridge the gap between your vision and capital. We provide growth advisory and manage your investor relations.',
      'features': [
        'Pitch Deck Optimization',
        'Valuation Advisory',
        'Due Diligence Readiness',
        'Investor Matchmaking',
        'Deal Structuring & Closing',
      ],
    },
    {
      'title': 'Risk Management',
      'subtitle': 'Defensive legal & enterprise safety',
      'icon': HugeIcons.strokeRoundedTask01,
      'color': const Color(0xFF14B8A6),
      'category': 'Legal',
      'description':
          'Build an enterprise safety net with defensive legal strategies and proactive risk mitigation frameworks.',
      'features': [
        'Legal Risk Assessment',
        'Policy & Contract Review',
        'Dispute Resolution Strategy',
        'Whistleblower Policy Setup',
        'Cyber-Legal Compliance',
      ],
    },
    {
      'title': 'Compliance Audit',
      'subtitle': 'Comprehensive statutory & operational audit',
      'icon': HugeIcons.strokeRoundedTask01,
      'color': const Color(0xFF10B981),
      'category': 'Legal',
      'description':
          'Ensure your business complies with all statutory regulations through our comprehensive audit, risk identification, and rectification support.',
      'features': [
        'Statutory Compliance Audit',
        'Operational Risk Assessment',
        'Filing Gap Analysis',
        'Detailed Compliance Report',
        'Expert Remediation Advisory',
      ],
    },
  ];

  List<Map<String, dynamic>> get _filteredServices {
    return _allServices.where((service) {
      final matchesSearch =
          service['title'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
          service['subtitle'].toLowerCase().contains(
            _searchQuery.toLowerCase(),
          );
      final matchesCategory =
          _selectedCategory == 'All' ||
          service['category'] == _selectedCategory;
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
    final filtered = _filteredServices;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Header
          SliverAppBar(
            expandedHeight: 220.r,
            pinned: true,
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            backgroundColor: AppTheme.deepTeal,
            leading: IconButton(
              icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.deepTeal,
                      AppTheme.corporateBlue.withOpacity(0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 56.r),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 60.r), // Room for back button
                      Container(
                        padding: EdgeInsets.all(12.r),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedBriefcase01,
                          color: Colors.white,
                          size: 32.ip,
                        ),
                      ),
                      SizedBox(height: 24.r),
                      Text(
                        'Our Services',
                        style: Theme.of(context).textTheme.headlineLarge
                            ?.copyWith(
                              color: Colors.white,
                              fontSize: 24.sp,
                            ),
                      ),
                      SizedBox(height: 8.r),
                      Text(
                        'Unlock higher standards with our curated global services.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withOpacity(0.7),
                          height: 1.4,
                          fontSize: 13.sp,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 2. Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(24.r),
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
                    hintText: 'Search legal & compliance solutions...',
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

          // 3. Category Filter Chips
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
                    'Popular Categories',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontSize: 14.sp,
                    ),
                  ),
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: 24.r),
                  child: Row(
                    children: ['All', 'Legal', 'Tax', 'Business'].map((cat) {
                      final isActive = _selectedCategory == cat;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedCategory = cat),
                        child: Container(
                          margin: EdgeInsets.only(right: 12.r),
                          padding: EdgeInsets.symmetric(
                            horizontal: 20.r,
                            vertical: 10.r,
                          ),
                          decoration: BoxDecoration(
                            color: isActive ? AppTheme.deepTeal : Colors.white,
                            borderRadius: BorderRadius.circular(12.r),
                            boxShadow: isActive ? AppTheme.softShadow : null,
                            border: Border.all(
                              color: isActive
                                  ? AppTheme.deepTeal
                                  : Colors.grey[200]!,
                            ),
                          ),
                          child: Text(
                            cat,
                            style: GoogleFonts.inter(
                              color: isActive ? Colors.white : Colors.grey[600],
                              fontSize: 12.sp,
                              fontWeight: isActive
                                  ? FontWeight.bold
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                SizedBox(height: 24.r),
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
                      size: 60,
                      color: Colors.grey.withOpacity(0.3),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No services found for "$_searchQuery"',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w600,
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
                  final service = filtered[index];
                  return Padding(
                    padding: EdgeInsets.only(bottom: 16.r),
                    child: _ServiceListCard(
                      title: service['title'],
                      subtitle: service['subtitle'],
                      icon: service['icon'],
                      color: service['color'],
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ServiceDetailScreen(
                              serviceName: service['title'],
                              icon: service['icon'],
                              description: service['description'],
                              features: List<String>.from(
                                service['features'] ?? [],
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

class _ServiceListCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final dynamic icon;
  final Color color;
  final VoidCallback onTap;

  const _ServiceListCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: AppTheme.softShadow,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20.r),
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
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        color: Colors.grey[600],
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, color: Colors.grey[300], size: 20.ip),
            ],
          ),
        ),
      ),
    );
  }
}
