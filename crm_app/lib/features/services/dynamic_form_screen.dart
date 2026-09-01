import 'dart:io';
import 'package:crm_app/core/utils/hint_helper.dart';
import 'package:flutter/material.dart';
import 'package:crm_app/core/utils/form_ui_helper.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:crm_app/core/utils/http_client.dart' as http;
import 'dart:convert';

import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/constants/port.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/hint_helper.dart';
import '../../core/utils/file_picker_util.dart';
import '../../core/utils/error_handler.dart';
import '../../core/widgets/app_dropdown.dart';
import '../../models/order_model.dart';
import '../../models/form_schema_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/draft_provider.dart';
import '../../core/utils/validation_utils.dart';

class DynamicFormScreen extends ConsumerStatefulWidget {
  final ServiceOrder order;
  const DynamicFormScreen({super.key, required this.order});

  @override
  ConsumerState<DynamicFormScreen> createState() => _DynamicFormScreenState();
}

class _DynamicFormScreenState extends ConsumerState<DynamicFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = true;
  FormSchema? _schema;
  
  // Storage for dynamic field inputs. We use dot-notation keys for deep nesting (e.g., 'directors[0].name')
  final Map<String, dynamic> _formData = {};
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, String?> _filePaths = {};
  final Map<String, bool> _passwordVisibility = {};

  @override
  void initState() {
    super.initState();
    _fetchSchema();
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Map<String, dynamic> _prefillData = {};
  List<dynamic> _prefillDocs = [];

  Future<void> _fetchSchema() async {
    try {
      final response = await http.get(Uri.parse('$kBaseUrl/api/forms/service/${Uri.encodeComponent(widget.order.serviceType)}'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _schema = FormSchema.fromJson(data);
        
        // Fetch prefill data
        try {
          final prefillResponse = await http.get(Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/prefill'));
          if (prefillResponse.statusCode == 200) {
            final prefillBody = json.decode(prefillResponse.body);
            if (prefillBody['success'] == true && prefillBody['data'] != null) {
              _prefillData = prefillBody['data']['formDetails'] ?? {};
              _prefillDocs = prefillBody['data']['uploadedDocuments'] ?? [];
            }
          }
        } catch (e) {
          debugPrint('Failed to load prefill data: $e');
        }

        _initializeFields(_schema!.fields, '');
        await _loadDraft();
      } else {
        throw Exception('Failed to load form schema');
      }
    } catch (e) {
      showGlobalError(e);
      if (mounted) _showError('Could not load the dynamic form. Please try again later.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final draft = await draftService.loadDraft(widget.order.id, 'DynamicForm_${widget.order.serviceType}');
    if (draft != null && mounted) {
      setState(() {
        draft.forEach((key, value) {
          if (_controllers.containsKey(key)) {
            _controllers[key]!.text = value?.toString() ?? '';
          } else {
            _formData[key] = value;
          }
        });
      });
    }
  }

  Future<void> _saveDraft() async {
    final draftService = ref.read(draftServiceProvider);
    final data = <String, dynamic>{};
    _controllers.forEach((key, controller) {
      data[key] = controller.text;
    });
    _formData.forEach((key, value) {
      data[key] = value;
    });
    await draftService.saveDraft(widget.order.id, 'DynamicForm_${widget.order.serviceType}', data);
  }

  void _initializeFields(List<FormFieldSchema> fields, String parentPath) {
    // Entity-Isolated Profile: Use the fetched prefillData which handles order details + master entity fallback
    final userProfile = _prefillData;

    for (var field in fields) {
      String currentPath = parentPath.isEmpty ? field.name : '$parentPath.${field.name}';
      
      if (field.type == 'group') {
        _initializeFields(field.subFields, currentPath);
      } else if (field.type == 'array') {
        int count = field.arrayConfig?.minItems ?? 1;
        if (field.arrayConfig?.dynamicCountRef != null) {
          final dynCount = widget.order.details[field.arrayConfig!.dynamicCountRef!];
          if (dynCount != null) {
            count = int.tryParse(dynCount.toString()) ?? count;
          }
        }
        for (int i = 0; i < count; i++) {
          _initializeFields(field.subFields, '$currentPath[$i]');
        }
      } else if (['text', 'number', 'email', 'phone', 'date'].contains(field.type)) {
        String autofillValue = '';
        if (userProfile.containsKey(currentPath)) {
          autofillValue = userProfile[currentPath].toString();
        } else if (userProfile.containsKey(field.name)) {
          // Fallback to un-nested root key if matching (e.g., 'companyName')
          autofillValue = userProfile[field.name].toString();
        }
        _controllers[currentPath] = TextEditingController(text: autofillValue);
      } else if (field.type == 'dropdown') {
        String? autofillValue;
        if (userProfile.containsKey(currentPath) && field.options.contains(userProfile[currentPath])) {
          autofillValue = userProfile[currentPath].toString();
        } else if (userProfile.containsKey(field.name) && field.options.contains(userProfile[field.name])) {
          autofillValue = userProfile[field.name].toString();
        } else {
          autofillValue = field.options.isNotEmpty ? field.options[0] : null;
        }
        _formData[currentPath] = autofillValue;
      }
    }
  }

  bool _evaluateCondition(Map<String, dynamic>? condition, String parentPath) {
    if (condition == null) return true;
    final targetField = condition['field'];
    
    // Resolve target path relative to parent if needed, or assume absolute
    String targetPath = targetField;
    if (parentPath.contains('[')) {
      // If we are inside an array, assume the condition refers to a field in the same array item
      final arrayPrefix = parentPath.substring(0, parentPath.lastIndexOf(']') + 1);
      targetPath = '$arrayPrefix.$targetField';
    }

    final actualValue = _formData[targetPath] ?? _controllers[targetPath]?.text;
    
    if (condition.containsKey('in')) {
      final List<dynamic> allowedValues = condition['in'];
      return allowedValues.contains(actualValue);
    }
    
    final targetValue = condition['equals'];
    return actualValue == targetValue;
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  Future<void> _pickFile(String pathKey, List<String>? allowedExtensions) async {
    try {
      FilePickerResult? result = await FilePickerUtil.pickFiles(
        type: FileType.custom,
        allowedExtensions: allowedExtensions ?? ['jpg', 'jpeg', 'png', 'pdf'],
      );
      if (result != null && result.files.single.path != null) {
        if (!mounted) return;
        setState(() {
          _filePaths[pathKey] = result.files.single.path;
        });
      }
    } catch (e) {
      if (mounted) _showError('Error picking file: $e');
    }
  }

  Future<void> _submitDetails() async {
    if (!_formKey.currentState!.validate()) {
      _showError('Please fill all required fields correctly.');
      return;
    }

    // Evaluate Cross Validations
    if (_schema!.crossValidations.isNotEmpty) {
      for (var cv in _schema!.crossValidations) {
        if (cv.type == 'sumEquals') {
          // This expects cv.fields to contain keys or regex matching keys
          double sum = 0;
          for (var fieldPattern in cv.fields) {
            _controllers.forEach((key, controller) {
              if (key.contains(fieldPattern) && controller.text.isNotEmpty) {
                sum += double.tryParse(controller.text) ?? 0;
              }
            });
          }
          if (sum != double.tryParse(cv.value.toString())) {
            _showError(cv.message ?? 'Cross validation failed: sum is not ${cv.value}');
            return;
          }
        }
      }
    }

    // Validate required files based on visibility
    bool filesValid = true;
    void validateFiles(List<FormFieldSchema> fields, String parentPath) {
      for (var field in fields) {
        String currentPath = parentPath.isEmpty ? field.name : '$parentPath.${field.name}';
        if (!_evaluateCondition(field.visibilityCondition, parentPath)) continue;

        if (field.type == 'file' && field.required) {
          bool hasValidNewFile = _filePaths[currentPath] != null && _filePaths[currentPath]!.isNotEmpty;
          
          if (!hasValidNewFile) {
            // Check if it has a prefill document, AND user hasn't explicitly removed it
            final lowerFieldName = field.name.toLowerCase();
            String targetDocType = '';
            if (lowerFieldName.contains('pan')) targetDocType = 'pan';
            else if (lowerFieldName.contains('aadhaar')) targetDocType = 'aadhaar';
            else if (lowerFieldName.contains('incorporation') || lowerFieldName.contains('coi')) targetDocType = 'coi';
            else if (lowerFieldName.contains('address') || lowerFieldName.contains('electricity')) targetDocType = 'addressProof';
            else if (lowerFieldName.contains('photo')) targetDocType = 'directorPhoto';
            else if (lowerFieldName.contains('bank')) targetDocType = 'bankStatement';
            else if (lowerFieldName.contains('gst')) targetDocType = 'gst';
            else if (lowerFieldName.contains('moa')) targetDocType = 'moa';
            else if (lowerFieldName.contains('aoa')) targetDocType = 'aoa';
            else if (lowerFieldName.contains('sales')) targetDocType = 'salesInvoice';
            else if (lowerFieldName.contains('purchase')) targetDocType = 'purchaseBills';

            dynamic existingDoc;
            if (targetDocType.isNotEmpty) {
              existingDoc = _prefillDocs.firstWhere((doc) => doc['documentType'] == targetDocType, orElse: () => null);
            }
            
            // If user clicked 'Replace', _filePaths[currentPath] is empty string.
            // If they haven't uploaded a new one, existingDoc is considered "removed" by the empty string.
            bool isIntentionallyRemoved = _filePaths[currentPath] == '';
            
            if (existingDoc == null || isIntentionallyRemoved) {
              _showError('Please upload ${field.label}');
              filesValid = false;
            }
          }
        } else if (field.type == 'group') {
          validateFiles(field.subFields, currentPath);
        } else if (field.type == 'array') {
          int count = field.arrayConfig?.minItems ?? 1;
          if (field.arrayConfig?.dynamicCountRef != null) {
            final dynCount = widget.order.details[field.arrayConfig!.dynamicCountRef!];
            if (dynCount != null) count = int.tryParse(dynCount.toString()) ?? count;
          }
          for (int i = 0; i < count; i++) {
            validateFiles(field.subFields, '$currentPath[$i]');
          }
        }
      }
    }
    validateFiles(_schema!.fields, '');
    if (!filesValid) return;

    setState(() => _isLoading = true);

    try {
      final uid = ref.read(authStateProvider).value?.uid;
      if (uid == null) throw Exception('Not authenticated');

      final uri = Uri.parse('$kBaseUrl/api/orders/${widget.order.id}/submit-dynamic-form');
      var request = http.MultipartRequest('POST', uri);
      request.headers['x-user-id'] = uid;

      // Construct deeply nested JSON map from dot-notation keys
      Map<String, dynamic> structuredData = {};
      
      void setNestedValue(String path, dynamic value) {
        final parts = path.split(RegExp(r'\.|\[|\]')).where((s) => s.isNotEmpty).toList();
        dynamic current = structuredData;
        for (int i = 0; i < parts.length - 1; i++) {
          final part = parts[i];
          final nextPart = parts[i + 1];
          final isNextArray = int.tryParse(nextPart) != null;
          
          if (current is Map) {
            if (!current.containsKey(part)) {
              current[part] = isNextArray ? [] : {};
            }
            current = current[part];
          } else if (current is List) {
            int idx = int.parse(part);
            while (current.length <= idx) current.add(isNextArray ? [] : {});
            current = current[idx];
          }
        }
        final lastPart = parts.last;
        if (current is Map) {
          current[lastPart] = value;
        } else if (current is List) {
          int idx = int.parse(lastPart);
          while (current.length <= idx) current.add(null);
          current[idx] = value;
        }
      }

      _controllers.forEach((key, controller) {
        setNestedValue(key, controller.text);
      });
      _formData.forEach((key, value) {
        setNestedValue(key, value);
      });

      // Send structured data as JSON string
      request.fields['dynamicData'] = json.encode(structuredData);

      // Populate files using dot-notation keys for backend tracking
      for (var entry in _filePaths.entries) {
        if (entry.value != null) {
          request.files.add(await http.MultipartFile.fromPath(entry.key, entry.value!));
        }
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Success'),
            content: const Text('Form submitted successfully!'),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
          ),
        );
        if (!mounted) return;
        ref.read(draftServiceProvider).clearDraft(widget.order.id, 'DynamicForm_${widget.order.serviceType}');
        if (mounted) Navigator.pop(context, true);
      } else {
        throw Exception('Failed to submit form: ${response.body}');
      }
    } catch (e) {
      showGlobalError(e);
      if (mounted) _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildField(FormFieldSchema field, String parentPath) {
    if (!_evaluateCondition(field.visibilityCondition, parentPath)) {
      return const SizedBox.shrink();
    }

    String currentPath = parentPath.isEmpty ? field.name : '$parentPath.${field.name}';

    if (field.type == 'group') {
      return Container(
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.blue.shade50.withOpacity(0.3), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.blue.shade100)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(field.label, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.corporateBlue)),
            const SizedBox(height: 16),
            ...field.subFields.map((subField) => _buildField(subField, currentPath)),
          ],
        ),
      );
    } else if (field.type == 'array') {
      int count = field.arrayConfig?.minItems ?? 1;
      if (field.arrayConfig?.dynamicCountRef != null) {
        final dynCount = widget.order.details[field.arrayConfig!.dynamicCountRef!];
        if (dynCount != null) count = int.tryParse(dynCount.toString()) ?? count;
      }
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(field.label, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.corporateBlue)),
          const SizedBox(height: 16),
          for (int i = 0; i < count; i++)
            Container(
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey[200]!)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Item ${i + 1}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 16),
                  ...field.subFields.map((subField) => _buildField(subField, '$currentPath[$i]')),
                ],
              ),
            ),
        ],
      );
    } else if (field.type == 'file') {
      return _buildFileRow(field, currentPath);
    } else if (field.type == 'dropdown') {
      return _buildDropdownRow(field, currentPath);
    } else if (field.type == 'checkbox') {
      return _buildCheckboxRow(field, currentPath);
    } else {
      return _buildTextField(field, currentPath);
    }
  }

  Widget _buildTextField(FormFieldSchema field, String pathKey) {
    TextInputType keyboardType = TextInputType.text;
    if (field.type == 'number') keyboardType = TextInputType.number;
    if (field.type == 'email') keyboardType = TextInputType.emailAddress;
    if (field.type == 'phone') keyboardType = TextInputType.phone;

    if (keyboardType == TextInputType.phone) {
      return PhoneInputField(
        controller: _controllers[pathKey]!,
        label: field.label,
        isRequired: field.required,
        description: field.description,
        hintText: HintHelper.getExampleHint(field.label, hint: field.description),
        onChanged: (v) {
          setState(() {});
        },
        validator: (v) {
          if (field.required && (v == null || v.trim().isEmpty)) return 'Required';
          if (v != null && v.isNotEmpty && !ValidationUtils.isValidPhone(v)) return 'Invalid phone';
          return null;
        },
      );
    }


    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: field.label,
              style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13, color: const Color(0xFF1E293B)),
              children: [if (field.required) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          if (field.description != null && field.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(field.description!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
          ],
          const SizedBox(height: 8),
          TextFormField(
            controller: _controllers[pathKey],
            keyboardType: keyboardType,
            readOnly: field.type == 'date',
            autovalidateMode: AutovalidateMode.onUserInteraction,
            obscureText: field.type == 'password' ? !(_passwordVisibility[pathKey] ?? false) : false,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.black87),
            onChanged: (v) {
              setState(() {}); // Trigger rebuild for dynamic visibility conditions
            },
            onTap: field.type == 'date' ? () async {
              final date = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
              if (date != null) {
                _controllers[pathKey]!.text = "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}";
                setState(() {});
              }
            } : null,
            decoration: InputDecoration(
              hintText: HintHelper.getExampleHint(field.label, hint: field.description),
              hintStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.grey.shade400),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.corporateBlue, width: 1.5)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: field.type == 'date' 
                  ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) 
                  : (field.type == 'password' 
                      ? IconButton(
                          icon: Icon((_passwordVisibility[pathKey] ?? false) ? Icons.visibility : Icons.visibility_off, size: 20, color: Colors.grey),
                          onPressed: () {
                            setState(() {
                              _passwordVisibility[pathKey] = !(_passwordVisibility[pathKey] ?? false);
                            });
                          },
                        )
                      : null),
            ),
            validator: (v) {
              if (field.required && (v == null || v.trim().isEmpty)) return 'Required';
              if (field.type == 'email' && v != null && v.isNotEmpty && !ValidationUtils.isValidEmail(v)) return 'Invalid email';
              if (field.type == 'phone' && v != null && v.isNotEmpty && !ValidationUtils.isValidPhone(v)) return 'Invalid phone';
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFileRow(FormFieldSchema field, String pathKey) {
    String? path = _filePaths[pathKey];
    
    // Check if we have an existing document from prefill
    dynamic existingDoc;
    final lowerFieldName = field.name.toLowerCase();
    
    // Fuzzy matching field name to prefill documentType
    String targetDocType = '';
    if (lowerFieldName.contains('pan')) targetDocType = 'pan';
    else if (lowerFieldName.contains('aadhaar')) targetDocType = 'aadhaar';
    else if (lowerFieldName.contains('incorporation') || lowerFieldName.contains('coi')) targetDocType = 'coi';
    else if (lowerFieldName.contains('address') || lowerFieldName.contains('electricity')) targetDocType = 'addressProof';
    else if (lowerFieldName.contains('photo')) targetDocType = 'directorPhoto';
    else if (lowerFieldName.contains('bank')) targetDocType = 'bankStatement';
    else if (lowerFieldName.contains('gst')) targetDocType = 'gst';
    else if (lowerFieldName.contains('moa')) targetDocType = 'moa';
    else if (lowerFieldName.contains('aoa')) targetDocType = 'aoa';
    else if (lowerFieldName.contains('sales')) targetDocType = 'salesInvoice';
    else if (lowerFieldName.contains('purchase')) targetDocType = 'purchaseBills';

    if (targetDocType.isNotEmpty) {
      existingDoc = _prefillDocs.firstWhere((doc) => doc['documentType'] == targetDocType, orElse: () => null);
    }

    // If user selected a new file, it overrides the existing one
    final bool hasExisting = existingDoc != null && path == null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: field.label,
              style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13, color: const Color(0xFF1E293B)),
              children: [if (field.required) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          if (field.description != null && field.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(field.description!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
          ],
          const SizedBox(height: 8),
          
          if (hasExisting)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.corporateBlue.withOpacity(0.1),
                border: Border.all(color: AppTheme.corporateBlue.withOpacity(0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppTheme.corporateBlue, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${existingDoc['name'] ?? 'Document'} (From Profile)',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.corporateBlue),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        // We mark this path with empty string to signify intentional removal of existing doc, triggering upload UI
                        _filePaths[pathKey] = ''; 
                      });
                    },
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(50, 30),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text('Replace', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.red)),
                  )
                ],
              ),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    path == null || path.isEmpty ? 'No file selected' : path.split(Platform.pathSeparator).last,
                    style: GoogleFonts.inter(fontSize: 13, color: path == null || path.isEmpty ? Colors.grey[500] : AppTheme.corporateBlue),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () => _pickFile(pathKey, field.allowedExtensions),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: path == null || path.isEmpty ? Colors.grey[400]! : AppTheme.corporateBlue),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    minimumSize: const Size(80, 32),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: Text(
                    path == null || path.isEmpty ? 'Upload' : 'Change',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: path == null || path.isEmpty ? Colors.black87 : AppTheme.corporateBlue),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildDropdownRow(FormFieldSchema field, String pathKey) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: field.label,
              style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13, color: const Color(0xFF1E293B)),
              children: [if (field.required) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))],
            ),
          ),
          if (field.description != null && field.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(field.description!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
          ],
          const SizedBox(height: 8),
          AppDropdownFormField<String>(
            value: _formData[pathKey],
            hint: Text(
              'Select Option',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.grey.shade400),
            ),
            decoration: InputDecoration(
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              filled: true,
              fillColor: Colors.white,
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
                borderSide: const BorderSide(color: AppTheme.corporateBlue, width: 1.5),
              ),
            ),
            items: field.options.map((item) {
              return DropdownMenuItem<String>(
                value: item,
                child: Text(
                  item,
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.black87),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 2,
                ),
              );
            }).toList(),
            validator: (value) => field.required && (value == null || value.isEmpty) ? 'Required' : null,
            onChanged: (value) {
              setState(() {
                _formData[pathKey] = value;
              });
              _saveDraft();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCheckboxRow(FormFieldSchema field, String pathKey) {
    // Default to false if not set
    bool isChecked = _formData[pathKey] == true;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: FormField<bool>(
        initialValue: isChecked,
        validator: (value) {
          if (field.required && (value == null || !value)) {
            return 'Please check the verification checkbox.';
          }
          return null;
        },
        builder: (state) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Checkbox(
                      value: isChecked,
                      onChanged: (val) {
                        setState(() { _formData[pathKey] = val; });
                        state.didChange(val);
                      },
                      activeColor: AppTheme.corporateBlue,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        text: (field.label.toLowerCase().startsWith('i ') || 
                               field.label.toLowerCase().contains('declare') || 
                               field.label.toLowerCase().contains('verify') || 
                               field.label.toLowerCase().contains('agree') ||
                               field.label.toLowerCase().contains('true'))
                            ? 'I Agree To The Terms Of Services & Privacy Policy'
                            : field.label, 
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.black87),
                        children: [
                          if (field.required) const TextSpan(text: ' *', style: TextStyle(color: Colors.red))
                        ]
                      ),
                    ),
                  ),
                ],
              ),
              if (state.hasError) ...[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 32),
                  child: Text(state.errorText!, style: GoogleFonts.inter(color: Colors.red, fontSize: 12)),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _handleBack(BuildContext context) async {
    final action = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Save Changes?',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87),
        ),
        content: Text(
          'Do you want to save your progress as a draft before leaving?',
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.black54),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        actions: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, 'save'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Save Draft',
                  style: GoogleFonts.inter(color: AppTheme.corporateBlue, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 4),
              TextButton(
                onPressed: () => Navigator.pop(ctx, 'cancel'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Cancel',
                  style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ),
              const SizedBox(width: 4),
              TextButton(
                onPressed: () => Navigator.pop(ctx, 'discard'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Discard',
                  style: GoogleFonts.inter(color: Colors.red.shade600, fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (action == 'save') {
      await _saveDraft();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Draft saved successfully'), duration: Duration(seconds: 1)),
        );
        Navigator.pop(context);
      }
    } else if (action == 'discard') {
      ref.read(draftServiceProvider).clearDraft(widget.order.id, 'DynamicForm_${widget.order.serviceType}');
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        await _handleBack(context);
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          title: Text(
            _schema?.title ?? widget.order.serviceType,
            style: GoogleFonts.inter(color: Colors.black87, fontWeight: FontWeight.w600, fontSize: 16),
          ),
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: () => _handleBack(context),
          ),
        ),
        body: _isLoading 
            ? const Center(child: CircularProgressIndicator()) 
            : _schema == null 
                ? Center(child: Text("Form schema not available.", style: GoogleFonts.inter(fontSize: 14, color: Colors.grey)))
                : Form(
                    key: _formKey,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        if (_schema!.subtitle != null)
                          Text(
                            _schema!.subtitle!,
                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.corporateBlue),
                          ),
                        const SizedBox(height: 24),
                        ..._schema!.fields.map((field) => _buildField(field, '')),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _submitDetails,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.corporateBlue,
                            minimumSize: const Size(double.infinity, 50),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            'Submit Application',
                            style: GoogleFonts.inter(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
      ),
    );
  }
}
