class ArrayConfig {
  final int? minItems;
  final int? maxItems;
  final String? dynamicCountRef;

  ArrayConfig({this.minItems, this.maxItems, this.dynamicCountRef});

  factory ArrayConfig.fromJson(Map<String, dynamic> json) {
    return ArrayConfig(
      minItems: json['minItems'],
      maxItems: json['maxItems'],
      dynamicCountRef: json['dynamicCountRef'],
    );
  }
}

class CrossValidation {
  final String type;
  final List<String> fields;
  final dynamic value;
  final String? message;

  CrossValidation({required this.type, required this.fields, this.value, this.message});

  factory CrossValidation.fromJson(Map<String, dynamic> json) {
    return CrossValidation(
      type: json['type'] ?? 'unknown',
      fields: List<String>.from(json['fields'] ?? []),
      value: json['value'],
      message: json['message'],
    );
  }
}

class FormFieldSchema {
  final String name;
  final String label;
  final String type;
  final bool required;
  final List<String> options;
  final List<String>? allowedExtensions;
  final String? description;
  final Map<String, dynamic>? visibilityCondition;
  final ArrayConfig? arrayConfig;
  final List<FormFieldSchema> subFields;

  FormFieldSchema({
    required this.name,
    required this.label,
    required this.type,
    required this.required,
    required this.options,
    this.allowedExtensions,
    this.description,
    this.visibilityCondition,
    this.arrayConfig,
    this.subFields = const [],
  });

  factory FormFieldSchema.fromJson(Map<String, dynamic> json) {
    return FormFieldSchema(
      name: json['name'] ?? '',
      label: json['label'] ?? '',
      type: json['type'] ?? 'text',
      required: json['required'] ?? false,
      options: (json['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      allowedExtensions: (json['allowedExtensions'] as List<dynamic>?)?.map((e) => e.toString()).toList(),
      description: json['description'],
      visibilityCondition: json['visibilityCondition'],
      arrayConfig: json['arrayConfig'] != null ? ArrayConfig.fromJson(json['arrayConfig']) : null,
      subFields: (json['subFields'] as List?)?.map((e) => FormFieldSchema.fromJson(e)).toList() ?? [],
    );
  }
}

class FormSchema {
  final String serviceName;
  final String? title;
  final String? subtitle;
  final List<FormFieldSchema> fields;
  final List<CrossValidation> crossValidations;

  FormSchema({
    required this.serviceName,
    this.title,
    this.subtitle,
    required this.fields,
    this.crossValidations = const [],
  });

  factory FormSchema.fromJson(Map<String, dynamic> json) {
    return FormSchema(
      serviceName: json['serviceName'] ?? '',
      title: json['title'],
      subtitle: json['subtitle'],
      fields: (json['fields'] as List?)?.map((e) => FormFieldSchema.fromJson(e)).toList() ?? [],
      crossValidations: (json['crossValidations'] as List?)?.map((e) => CrossValidation.fromJson(e)).toList() ?? [],
    );
  }
}
