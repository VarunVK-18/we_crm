import os
import re

FORMS_DIR = r"c:\projects\we_crm\crm_app\lib\features\orders\forms"
DYNAMIC_FORM = r"c:\projects\we_crm\crm_app\lib\features\services\dynamic_form_screen.dart"

def patch_dynamic_form():
    with open(DYNAMIC_FORM, 'r', encoding='utf-8') as f:
        content = f.read()

    if "form_ui_helper.dart" not in content:
        content = re.sub(
            r"(import 'package:flutter/material.dart';)",
            r"\1\nimport 'package:crm_app/core/utils/form_ui_helper.dart';",
            content
        )

    if "PhoneInputField" not in content:
        phone_code = """
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
"""
        content = re.sub(
            r"(if \(field\.type == 'phone'\) keyboardType = TextInputType\.phone;)",
            r"\1\n" + phone_code,
            content
        )

    with open(DYNAMIC_FORM, 'w', encoding='utf-8') as f:
        f.write(content)


def patch_hardcoded_forms():
    for root, dirs, files in os.walk(FORMS_DIR):
        for file in files:
            if not file.endswith('.dart'):
                continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            if "form_ui_helper.dart" not in content:
                content = re.sub(
                    r"(import 'package:flutter/material.dart';)",
                    r"\1\nimport 'package:crm_app/core/utils/form_ui_helper.dart';",
                    content
                )

            # Find _buildField signature using a more robust regex
            match = re.search(r"(Widget\s+_buildField\(.*?\)\s*\{)", content, re.DOTALL)
            if match:
                signature = match.group(1)
                
                # Check if it was already patched
                if "if (keyboardType == TextInputType.phone)" in content.split(signature, 1)[1][:100]:
                    continue

                if "TextInputType keyboardType" in signature:
                    validator_param = "null"
                    if "customValidator" in signature:
                        validator_param = "customValidator"
                    elif "validator" in signature:
                        validator_param = "validator"

                    hint_param = "hint" if "String hint" in signature else "null"

                    phone_code = f"""
    if (keyboardType == TextInputType.phone) {{
      return PhoneInputField(
        controller: controller,
        label: label,
        isRequired: isRequired,
        hintText: {hint_param},
        validator: {validator_param},
      );
    }}
"""
                    content = content.replace(signature, signature + phone_code)
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                        print(f"Patched {file}")

if __name__ == "__main__":
    patch_dynamic_form()
    print("Patched dynamic form")
    patch_hardcoded_forms()
    print("Done")
