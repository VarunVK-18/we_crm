const fs = require('fs');

const filePath = 'c:\\projects\\we_crm\\crm_backend\\controllers\\authController.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `        if (entityIndex !== -1) {
          if (incorporationDate) {
            let parsedDate = null;
            if (/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(incorporationDate)) {
              const [dd, mm, yyyy] = incorporationDate.split('/');
              parsedDate = new Date(\`\${yyyy}-\${mm}-\${dd}\`);
            } else {
              parsedDate = new Date(incorporationDate);
            }
            user.client_entities[entityIndex].incorporation_date = isNaN(parsedDate.getTime()) ? null : parsedDate;
          }
          if (businessType) {
            user.client_entities[entityIndex].entityType = businessType;
          }
          user.markModified('client_entities');
        }`;

const replacementStr = `        if (entityIndex !== -1) {
          if (incorporationDate) {
            let parsedDate = null;
            if (/^\\d{2}\\/\\d{2}\\/\\d{4}$/.test(incorporationDate)) {
              const [dd, mm, yyyy] = incorporationDate.split('/');
              parsedDate = new Date(\`\${yyyy}-\${mm}-\${dd}\`);
            } else {
              parsedDate = new Date(incorporationDate);
            }
            user.client_entities[entityIndex].incorporation_date = isNaN(parsedDate.getTime()) ? null : parsedDate;
          }
          if (businessType) {
            user.client_entities[entityIndex].entityType = businessType;
          }
          
          if (dynamicFields) {
            if (dynamicFields.bankName || dynamicFields.accountNumber || dynamicFields.ifscCode || dynamicFields.accountType) {
              if (!user.client_entities[entityIndex].bank_details) user.client_entities[entityIndex].bank_details = {};
              if (dynamicFields.bankName) user.client_entities[entityIndex].bank_details.bankName = dynamicFields.bankName;
              if (dynamicFields.accountNumber) user.client_entities[entityIndex].bank_details.accountNumber = dynamicFields.accountNumber;
              if (dynamicFields.ifscCode) user.client_entities[entityIndex].bank_details.ifscCode = dynamicFields.ifscCode;
              if (dynamicFields.accountType) user.client_entities[entityIndex].bank_details.accountType = dynamicFields.accountType;
            }
            if (dynamicFields.authorizedCapital) user.client_entities[entityIndex].authorised_capital = dynamicFields.authorizedCapital;
            if (dynamicFields.paidUpCapital) user.client_entities[entityIndex].paidup_capital = dynamicFields.paidUpCapital;
            if (dynamicFields.constitutionType) user.client_entities[entityIndex].company_type_expanded = dynamicFields.constitutionType;
            if (dynamicFields.natureOfBusiness) user.client_entities[entityIndex].main_division_description = dynamicFields.natureOfBusiness;
          }

          user.markModified('client_entities');
        }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully patched authController.js");
} else {
  console.log("Target string not found in authController.js!");
}
