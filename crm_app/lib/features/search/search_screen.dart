import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_theme.dart';
import '../services/service_selection_screen.dart';
import '../services/service_detail_screen.dart';
import '../services/tool_detail_screen.dart';
import '../services/registration_services_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  String _searchQuery = '';

  // Master List of Searchable Items
  final List<Map<String, dynamic>> _masterItems = [
    // Recommended Services (Registration Hub Tabs)
    {
      'label': 'Incorporation',
      'icon': HugeIcons.strokeRoundedOffice,
      'category': 'RegistrationTab',
    },
    {
      'label': 'Compliance',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'category': 'RegistrationTab',
    },
    {
      'label': 'Tax',
      'icon': HugeIcons.strokeRoundedCalculator,
      'category': 'RegistrationTab',
    },
    {
      'label': 'All Services',
      'icon': HugeIcons.strokeRoundedDashboardSquare01,
      'category': 'RegistrationTab',
    },
    
    // --- Incorporation ---
    {
      'label': 'Private Limited Incorporation',
      'icon': HugeIcons.strokeRoundedOffice,
      'category': 'Incorporation',
    },
    {
      'label': 'LLP Incorporation',
      'icon': HugeIcons.strokeRoundedBriefcase01,
      'category': 'Incorporation',
    },
    {
      'label': 'OPC',
      'icon': HugeIcons.strokeRoundedUser,
      'category': 'Incorporation',
    },
    {
      'label': 'Proprietorship',
      'icon': HugeIcons.strokeRoundedUser,
      'category': 'Incorporation',
    },
    {
      'label': 'MSME',
      'icon': LucideIcons.medal,
      'category': 'Incorporation',
    },

    // --- Compliance ---
    {
      'label': 'MCA Compliance',
      'icon': HugeIcons.strokeRoundedTask01,
      'category': 'Compliance',
    },
    {
      'label': 'TDS',
      'icon': HugeIcons.strokeRoundedCalculator,
      'category': 'Compliance',
    },
    {
      'label': 'PF',
      'icon': HugeIcons.strokeRoundedDocumentValidation,
      'category': 'Compliance',
    },

    // --- IP ---
    {
      'label': 'Trade Mark',
      'icon': LucideIcons.tag,
      'category': 'IP',
    },
    {
      'label': 'Copyright',
      'icon': LucideIcons.copyright,
      'category': 'IP',
    },
    {
      'label': 'Patent',
      'icon': LucideIcons.lightbulb,
      'category': 'IP',
    },

    // --- Tax ---
    {
      'label': 'GST Registration',
      'icon': HugeIcons.strokeRoundedFile02,
      'category': 'Tax',
    },
    {
      'label': 'GST Compliance',
      'icon': HugeIcons.strokeRoundedFile02,
      'category': 'Tax',
    },
    {
      'label': 'GST Cancelation',
      'icon': LucideIcons.fileX,
      'category': 'Tax',
    },
    {
      'label': 'GST filing',
      'icon': HugeIcons.strokeRoundedTask01,
      'category': 'Tax',
    },
    {
      'label': 'ITR',
      'icon': HugeIcons.strokeRoundedInvoice02,
      'category': 'Tax',
    },

    // Tools & Calculators
    {
      'label': 'NIC Code Finder',
      'icon': HugeIcons.strokeRoundedSourceCode,
      'category': 'Tools',
    },
    {
      'label': 'TDS Interest',
      'icon': HugeIcons.strokeRoundedBackpack01,
      'category': 'Tools',
    },
    {
      'label': 'GST Calculator',
      'icon': HugeIcons.strokeRoundedCalculator,
      'category': 'Tools',
    },
    {
      'label': 'GST Interest',
      'icon': HugeIcons.strokeRoundedPercentCircle,
      'category': 'Tools',
    },
    {
      'label': 'Income Tax Calculator',
      'icon': HugeIcons.strokeRoundedCalculator,
      'category': 'Tools',
    },
  ];

  List<Map<String, dynamic>> get _filteredItems {
    if (_searchQuery.isEmpty) return [];
    return _masterItems
        .where(
          (item) => (item['label'] as String).toLowerCase().contains(
            _searchQuery.toLowerCase(),
          ),
        )
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text;
      });
    });
    // Auto-focus the search bar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        toolbarHeight: 90,
        automaticallyImplyLeading: false,
        flexibleSpace: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const HugeIcon(
                      icon: HugeIcons.strokeRoundedArrowLeft01,
                      color: AppTheme.deepTeal,
                      size: 20,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    height: 52,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const HugeIcon(
                          icon: HugeIcons.strokeRoundedSearch01,
                          color: Colors.grey,
                          size: 18,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            focusNode: _focusNode,
                            decoration: const InputDecoration(
                              hintText: 'Search tools or services...',
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              filled: false,
                              fillColor: Colors.transparent,
                              contentPadding: EdgeInsets.zero,
                              hintStyle: TextStyle(
                                color: Colors.grey,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                              isDense: true,
                            ),
                            style: const TextStyle(
                              fontSize: 15,
                              color: AppTheme.deepTeal,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        if (_searchQuery.isNotEmpty)
                          GestureDetector(
                            onTap: () => _searchController.clear(),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.grey[300],
                                shape: BoxShape.circle,
                              ),
                              child: const HugeIcon(
                                icon: HugeIcons.strokeRoundedCancel01,
                                color: Colors.white,
                                size: 10,
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
      ),
      body: _searchQuery.isEmpty
          ? _buildDiscoveryView()
          : _buildSearchResultsView(),
    );
  }

  Widget _buildDiscoveryView() {
    final services = _masterItems
        .where((i) => i['category'] == 'RegistrationTab')
        .take(4)
        .toList();
    final tools = _masterItems.where((i) => i['category'] == 'Tools').toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recommended Services',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: Colors.black87,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          _SearchCategoryGrid(items: services, onItemTap: _handleItemTap),

          const SizedBox(height: 48),

          const Text(
            'Tools & Calculators',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: Colors.black87,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          _SearchCategoryGrid(items: tools, onItemTap: _handleItemTap),
        ],
      ),
    );
  }

  // 2. Search Results View (Filtered list)
  Widget _buildSearchResultsView() {
    final results = _filteredItems;

    if (results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            HugeIcon(
              icon: HugeIcons.strokeRoundedSearch01,
              size: 64,
              color: Colors.grey.withOpacity(0.2),
            ),
            const SizedBox(height: 16),
            Text(
              'No match for "$_searchQuery"',
              style: const TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: results.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = results[index];
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 4,
            ),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.corporateBlue.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: item['icon'] is IconData
                  ? Icon(
                      item['icon'] as IconData,
                      color: AppTheme.corporateBlue,
                      size: 20,
                    )
                  : HugeIcon(
                      icon: item['icon'],
                      color: AppTheme.corporateBlue,
                      size: 20,
                    ),
            ),
            title: Text(
              item['label'] as String,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: AppTheme.deepTeal,
                fontSize: 14,
              ),
            ),
            subtitle: Text(
              item['category'] == 'RegistrationTab' ? 'Services' : item['category'] as String,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[500],
                fontWeight: FontWeight.w600,
              ),
            ),
            trailing: Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: Colors.grey[300],
            ),
            onTap: () => _handleItemTap(item['label'] as String),
          ),
        );
      },
    );
  }

  void _handleItemTap(String label) {
    final item = _masterItems.firstWhere((i) => i['label'] == label);
    final isTool = item['category'] == 'Tools';
    final isRegistrationTab = item['category'] == 'RegistrationTab';

    if (isRegistrationTab) {
      final initialCat = label == 'All Services' ? 'All' : label;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => RegistrationServicesScreen(
            initialCategory: initialCat,
          ),
        ),
      );
      return;
    }

    if (isTool) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              ToolDetailScreen(toolName: label, icon: item['icon']),
        ),
      );
    } else {
      // Direct navigation for services from search
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              ServiceDetailScreen(serviceName: label, icon: item['icon']),
        ),
      );
    }
  }
}

class _SearchCategoryGrid extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final Function(String) onItemTap;
  const _SearchCategoryGrid({required this.items, required this.onItemTap});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.85,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final label = item['label'] as String;

        return Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          child: InkWell(
            onTap: () => onItemTap(label),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppTheme.corporateBlue.withOpacity(0.1),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.corporateBlue.withOpacity(0.05),
                      shape: BoxShape.circle,
                    ),
                    child: item['icon'] is IconData
                        ? Icon(
                            item['icon'] as IconData,
                            color: AppTheme.corporateBlue,
                            size: 22,
                          )
                        : HugeIcon(
                            icon: item['icon'],
                            color: AppTheme.corporateBlue,
                            size: 22,
                          ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.deepTeal,
                        height: 1.1,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
