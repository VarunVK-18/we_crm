import re

def update_file():
    filepath = r'c:\projects\we_crm\crm_app\lib\features\profile\my_entities_screen.dart'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add the import
    if 'dropdown_button2.dart' not in content:
        content = content.replace(
            "import '../../core/utils/error_handler.dart';",
            "import '../../core/utils/error_handler.dart';\nimport 'package:dropdown_button2/dropdown_button2.dart';"
        )

    # Find the _AddEntityBottomSheetState class and replace it
    start_str = 'class _AddEntityBottomSheetState extends ConsumerState<_AddEntityBottomSheet> {'
    end_str = 'class _EntityCardData {'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        before = content[:start_idx]
        after = content[end_idx:]
        
        new_class = '''class _AddEntityBottomSheetState extends ConsumerState<_AddEntityBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _typeController = TextEditingController();
  final _directorController = TextEditingController();
  final _stateController = TextEditingController();
  final TextEditingController _stateSearchController = TextEditingController();
  
  bool _isLoading = false;

  final List<String> _companyTypes = [
    'Private Limited',
    'LLP',
    'One Person Company',
    'Proprietorship',
    'Others',
  ];

  final List<String> _indianStates = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _typeController.dispose();
    _directorController.dispose();
    _stateController.dispose();
    _stateSearchController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);

    try {
      final authRepo = ref.read(authRepositoryProvider);
      await authRepo.addEntity(
        companyName: _nameController.text.trim(),
        companyType: _typeController.text.trim(),
        directorCount: _directorController.text.trim(),
        stateOfRegistration: _stateController.text.trim(),
      );
      
      if (!mounted) return;
      
      Navigator.pop(context);
      
      globalScaffoldMessengerKey.currentState?.showSnackBar(
        SnackBar(
          content: Text('Your request to add "${_nameController.text.trim()}" has been sent.'),
          backgroundColor: AppTheme.deepTeal,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Add New Entity',
                  style: GoogleFonts.outfit(
                    color: AppTheme.deepTeal,
                    fontWeight: FontWeight.w600,
                    fontSize: 20,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x, color: Colors.black54),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Submit a request to add a secondary company to your profile.',
              style: GoogleFonts.poppins(
                color: Colors.black54,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _nameController,
              autofocus: true,
              style: GoogleFonts.poppins(color: Colors.black87),
              decoration: InputDecoration(
                labelText: 'Entity Name',
                labelStyle: GoogleFonts.poppins(color: Colors.black54),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (v.trim().length < 3) return 'Name too short';
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField2<String>(
              isExpanded: true,
              decoration: InputDecoration(
                labelText: 'Type of Company',
                labelStyle: GoogleFonts.poppins(color: Colors.black54),
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
              hint: Text('Select Company Type', style: GoogleFonts.poppins(color: Colors.black54)),
              items: _companyTypes.map((item) => DropdownItem<String>(
                value: item,
                child: Text(item, style: GoogleFonts.poppins(fontSize: 14)),
              )).toList(),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Please select company type';
                return null;
              },
              onChanged: (value) {
                if (value != null) _typeController.text = value;
              },
              iconStyleData: const IconStyleData(
                icon: Icon(LucideIcons.chevronDown, color: Colors.black54),
              ),
              dropdownStyleData: DropdownStyleData(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _directorController,
              keyboardType: TextInputType.number,
              style: GoogleFonts.poppins(color: Colors.black87),
              decoration: InputDecoration(
                labelText: 'Number of Directors',
                hintText: 'e.g. 2',
                labelStyle: GoogleFonts.poppins(color: Colors.black54),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField2<String>(
              isExpanded: true,
              decoration: InputDecoration(
                labelText: 'State of Registration',
                labelStyle: GoogleFonts.poppins(color: Colors.black54),
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.deepTeal),
                ),
              ),
              hint: Text('Select State / UT', style: GoogleFonts.poppins(color: Colors.black54)),
              items: _indianStates.map((item) => DropdownItem<String>(
                value: item,
                child: Text(item, style: GoogleFonts.poppins(fontSize: 14)),
              )).toList(),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Please select state of registration';
                return null;
              },
              onChanged: (value) {
                if (value != null) _stateController.text = value;
              },
              iconStyleData: const IconStyleData(
                icon: Icon(LucideIcons.chevronDown, color: Colors.black54),
              ),
              dropdownStyleData: DropdownStyleData(
                maxHeight: 300,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              dropdownSearchData: DropdownSearchData(
                searchController: _stateSearchController,
                searchBarWidgetHeight: 50,
                searchBarWidget: Container(
                  height: 50,
                  padding: const EdgeInsets.only(
                    top: 8,
                    bottom: 4,
                    right: 8,
                    left: 8,
                  ),
                  child: TextFormField(
                    expands: true,
                    maxLines: null,
                    controller: _stateSearchController,
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      hintText: 'Search for a state...',
                      hintStyle: const TextStyle(fontSize: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                searchMatchFn: (item, searchValue) {
                  return item.value.toString().toLowerCase().contains(searchValue.toLowerCase());
                },
              ),
              onMenuStateChange: (isOpen) {
                if (!isOpen) {
                  _stateSearchController.clear();
                }
              },
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _submitRequest,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.deepTeal,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      'Submit Request',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Data holder ──────────────────────────────────────────────────────────────
'''
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(before + new_class + after)
        print("Successfully updated file.")
    else:
        print("Could not find start/end indices.")

if __name__ == '__main__':
    update_file()
