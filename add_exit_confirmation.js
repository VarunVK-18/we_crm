const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'crm_app/lib/features/orders');
const files = fs.readdirSync(dir).filter(f => f.endsWith('_form_screen.dart'));

const willPopCode = `
  Future<bool> _onWillPop() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Are You Sure To Exit ?', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          content: Text('Any unsaved progress will be lost.', style: GoogleFonts.inter()),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('No', style: GoogleFonts.inter(color: AppTheme.corporateBlue)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: Text('Yes', style: GoogleFonts.inter(color: Colors.white)),
            ),
          ],
        );
      },
    );
    return shouldPop ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
`;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already applied
  if (content.includes('WillPopScope')) {
    console.log(`Skipped (already has WillPopScope): ${file}`);
    continue;
  }

  // Find build method
  const buildRegex = /@override\s+Widget build\(BuildContext context\)\s*\{\s*return\s+Scaffold\(/m;
  if (!buildRegex.test(content)) {
    console.log(`Could not find standard Scaffold build method in: ${file}`);
    continue;
  }

  content = content.replace(buildRegex, willPopCode.trim() + '\n');
  
  // Need to add closing parenthesis for WillPopScope at the very end of the build method
  // Actually, wait, just wrapping Scaffold means we need to add a closing parenthesis `)` at the end of the Scaffold.
  // The Scaffold in build method usually ends right before the next method or the end of the class.
  // To avoid parsing dart accurately, we can replace the closing brace of the build method.
  // But wait, what if we use a regex to find the end of the Scaffold?
  // Let's look at how the build method ends in these files.
}
