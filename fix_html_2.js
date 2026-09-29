const fs = require('fs');
const file = 'c:/projects/we_crm/webpage/src/app/client/client-profile.html';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  '              </div>\r\n            </div>\r\n            \r\n            <div class=\"documents-list\">',
  '              </div>\r\n              </div>\r\n            </div>\r\n            \r\n            <div class=\"documents-list\">'
);
fs.writeFileSync(file, content);
console.log('Done!');
