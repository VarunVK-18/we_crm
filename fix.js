const fs = require('fs');
let html = fs.readFileSync('c:/projects/we_crm/webpage/src/app/client/client-profile.html', 'utf8');

// 1. Remove my placeholder directors section
html = html.replace(/@if \(activeTab\(\) === 'directors'\) \{[\s\S]*?@if \(activeTab\(\) === 'documents'\) \{/, "@if (activeTab() === 'documents') {");

// 2. Wrap the old Directors Section with @if (activeTab() === 'directors')
html = html.replace(/<div class="profile-card directors-card"/, "@if (activeTab() === 'directors') {\n          <div class=\"profile-card directors-card\"");

// 3. Add closing brace after the directors block
html = html.replace(/<\/div>\s*<!-- Document Viewer Modal -->/, "  </div>\n        }\n\n<!-- Document Viewer Modal -->");

fs.writeFileSync('c:/projects/we_crm/webpage/src/app/client/client-profile.html', html);
