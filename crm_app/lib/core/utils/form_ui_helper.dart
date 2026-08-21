import 'package:crm_app/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:google_fonts/google_fonts.dart';

Future<DateTime?> showCustomDatePicker(BuildContext context,
    {DateTime? initialDate, DateTime? firstDate, DateTime? lastDate}) async {
  return await showDatePicker(
    context: context,
    initialDate: initialDate ?? DateTime.now(),
    firstDate: firstDate ?? DateTime(1900),
    lastDate: lastDate ?? DateTime(2100),
    builder: (context, child) {
      return Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppTheme.corporateBlue,
            onPrimary: Colors.white,
            surface: Colors.white,
            onSurface: Color(0xFF1E293B),
          ),
          dialogTheme: const DialogThemeData(backgroundColor: Colors.white),
          textButtonTheme: TextButtonThemeData(
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.corporateBlue,
              textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
            ),
          ),
          textTheme: GoogleFonts.interTextTheme(
            Theme.of(context).textTheme,
          ),
          datePickerTheme: DatePickerThemeData(
            headerHeadlineStyle: GoogleFonts.inter(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
            headerHelpStyle: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.white70,
            ),
            dayStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
            weekdayStyle: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade600,
            ),
            yearStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
            todayForegroundColor: WidgetStateProperty.all(AppTheme.corporateBlue),
            todayBorder: const BorderSide(color: AppTheme.corporateBlue, width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        child: child!,
      );
    },
  );
}

// Country code data
const List<Map<String, String>> kCountryCodes = [
  {'code': '+91', 'flag': '🇮🇳', 'name': 'India'},
  {'code': '+1', 'flag': '🇺🇸', 'name': 'USA'},
  {'code': '+44', 'flag': '🇬🇧', 'name': 'UK'},
  {'code': '+971', 'flag': '🇦🇪', 'name': 'UAE'},
  {'code': '+65', 'flag': '🇸🇬', 'name': 'Singapore'},
  {'code': '+61', 'flag': '🇦🇺', 'name': 'Australia'},
  {'code': '+60', 'flag': '🇲🇾', 'name': 'Malaysia'},
  {'code': '+974', 'flag': '🇶🇦', 'name': 'Qatar'},
  {'code': '+966', 'flag': '🇸🇦', 'name': 'Saudi Arabia'},
];

class PhoneInputField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final bool isRequired;
  final String? Function(String?)? validator;
  final String? description;
  final String? hintText;
  final void Function(String)? onChanged;
  final bool readOnly;

  const PhoneInputField({
    Key? key,
    required this.controller,
    required this.label,
    this.isRequired = false,
    this.validator,
    this.description,
    this.hintText,
    this.onChanged,
    this.readOnly = false,
  }) : super(key: key);

  @override
  State<PhoneInputField> createState() => _PhoneInputFieldState();
}

class _PhoneInputFieldState extends State<PhoneInputField> {
  final ValueNotifier<String> _codeNotifier = ValueNotifier('+91');

  @override
  void dispose() {
    _codeNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: widget.label,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: AppTheme.deepTeal,
              ),
              children: [
                if (widget.isRequired)
                  const TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
          if (widget.description != null && widget.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(widget.description!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
          ],
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Country code dropdown using DropdownButton2
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.white,
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton2<String>(
                    valueListenable: _codeNotifier,
                    isExpanded: false,
                    buttonStyleData: const ButtonStyleData(
                      width: 90,
                      padding: EdgeInsets.zero,
                    ),
                    iconStyleData: const IconStyleData(
                      icon: Icon(Icons.keyboard_arrow_down, size: 16, color: Colors.grey),
                    ),
                    dropdownStyleData: DropdownStyleData(
                      width: 180,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white,
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                    ),
                    menuItemStyleData: const MenuItemStyleData(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                    ),
                    selectedItemBuilder: (context) {
                      return kCountryCodes.map((c) {
                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(c['flag']!, style: const TextStyle(fontSize: 16)),
                              const SizedBox(width: 4),
                              Text(
                                c['code']!,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList();
                    },
                    items: kCountryCodes.map((c) {
                      return DropdownItem<String>(
                        value: c['code'],
                        child: Row(
                          children: [
                            Text(c['flag']!, style: const TextStyle(fontSize: 18)),
                            const SizedBox(width: 8),
                            Text(
                              '${c['name']} (${c['code']})',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF1E293B),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        _codeNotifier.value = val;
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextFormField(
                  controller: widget.controller,
                  keyboardType: TextInputType.phone,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  readOnly: widget.readOnly,
                  onChanged: widget.onChanged,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                    color: Colors.black87,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hintText ?? 'e.g. 9876543210',
                    hintStyle: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      color: Colors.grey.shade400,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          const BorderSide(color: AppTheme.corporateBlue, width: 1.5),
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  validator: widget.validator ??
                      (v) {
                        if (widget.isRequired && (v == null || v.trim().isEmpty)) {
                          return 'Required';
                        }
                        if (v != null &&
                            v.trim().isNotEmpty &&
                            !RegExp(r'^[0-9]{10}$').hasMatch(v.trim())) {
                          return 'Enter a valid 10-digit phone number';
                        }
                        return null;
                      },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
