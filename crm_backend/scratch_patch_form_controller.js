const fs = require('fs');
const path = 'c:\\\\projects\\\\we_crm\\\\crm_backend\\\\controllers\\\\formController.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/await FormSchema\.findOne\(\{ serviceName: requestedName \}\);/g, "await FormSchema.findOne({ serviceName: requestedName }).lean();");
c = c.replace(/await FormSchema\.findOne\(\{\s*serviceName: \{ \$regex: new RegExp\('\^' \+ requestedName \+ '\$', 'i'\) \}\s*\}\);/g, "await FormSchema.findOne({ serviceName: { $regex: new RegExp('^' + requestedName + '$', 'i') } }).lean();");
c = c.replace(/await FormSchema\.findOne\(\{\s*serviceName: \{ \$regex: new RegExp\(requestedName, 'i'\) \}\s*\}\);/g, "await FormSchema.findOne({ serviceName: { $regex: new RegExp(requestedName, 'i') } }).lean();");
c = c.replace(/await FormSchema\.findOne\(\{\s*serviceName: \{ \$regex: new RegExp\(regexStr, 'i'\) \}\s*\}\);/g, "await FormSchema.findOne({ serviceName: { $regex: new RegExp(regexStr, 'i') } }).lean();");
c = c.replace(/await FormSchema\.findOne\(\{ serviceName: \{ \$regex: \/trademark\/i \} \}\);/g, "await FormSchema.findOne({ serviceName: { $regex: /trademark/i } }).lean();");

fs.writeFileSync(path, c, 'utf8');
console.log('Patched formController.js');
