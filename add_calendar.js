const fs = require('fs');
const path = require('path');

const appFormsDir = 'c:/projects/we_crm/crm_app/lib/features/orders';

function processDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    if (file.isFile() && fullPath.endsWith('_screen.dart')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // 1. Update _buildField signature to include `bool isDate = false`
      content = content.replace(
        /Widget _buildField\(String label, String hint, TextEditingController controller, \{bool isRequired = false, TextInputType keyboardType = TextInputType.text(?:, int maxLines = 1)?\}\) \{/,
        (match) => match.replace('}) {', ', bool isDate = false}) {')
      );

      // 2. Add readOnly, onTap, and suffixIcon to TextFormField inside _buildField
      content = content.replace(
        /TextFormField\([\s\S]*?validator:/,
        (match) => {
          if (match.includes('readOnly: isDate')) return match; // Already processed
          
          let modified = match.replace(
            /(keyboardType: keyboardType,)([\s\S]*?)(decoration: InputDecoration\()/,
            `$1
            readOnly: isDate,
            onTap: isDate ? () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime(1900),
                lastDate: DateTime(2100),
              );
              if (date != null) {
                controller.text = "\${date.day.toString().padLeft(2, '0')}/\${date.month.toString().padLeft(2, '0')}/\${date.year}";
              }
            } : null,$2$3`
          );
          
          modified = modified.replace(
            /contentPadding: const EdgeInsets\.symmetric\(horizontal: 16, vertical: 12\),/,
            `contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 20, color: Colors.grey) : null,`
          );
          
          return modified;
        }
      );

      // 3. Update all _buildField calls that contain 'DOB', 'Date of ', or 'Date Of ' in their label parameter to pass isDate: true
      content = content.replace(/_buildField\(\s*'[^']*?(?:DOB|Date of|Date Of)[^']*?',\s*(.*?)\)/g, (match) => {
        if (match.includes('isDate: true')) return match; // Already processed
        return match.replace(/\)$/, ', isDate: true)');
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(appFormsDir);
console.log('Done!');
