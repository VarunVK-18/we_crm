const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/profile/company_details_screen.dart', 'utf8');

c = c.replace(/if \(widget\.entity\.cin\.isEmpty && widget\.entity\.pan\.isEmpty && widget\.entity\.tan\.isEmpty &&[\s\S]*?No incorporation details available\.',[\s\S]*?\)[\s\S]*?\),[\s\S]*?\),/, '');

fs.writeFileSync('crm_app/lib/features/profile/company_details_screen.dart', c);
