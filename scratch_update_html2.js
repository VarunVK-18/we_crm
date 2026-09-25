const fs = require('fs');
const path = 'webpage/src/app/client/client-profile.html';
let content = fs.readFileSync(path, 'utf8');

const target = `<div class="documents-list">
              <!-- Default fields that could have documents attached directly on the user model -->
              @if (user()?.pan_file`;

const replacement = `<div class="documents-list">
              <!-- Add header for Company Documents if they exist at the root level -->
              @if (user()?.pan_file || user()?.gstin_file) {
                <div class="elegant-section-group" style="margin-top: 16px; margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
                  Company Documents
                </div>
              }
              <!-- Default fields that could have documents attached directly on the user model -->
              @if (user()?.pan_file`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replaced top header successfully.');
} else {
  console.log('Could not find top header target.');
}

// Ensure "Company Documents" category isn't duplicated if it's already at the top.
// Actually, it's fine if they are visually distinct blocks, but let's just make sure the user is getting a hard refresh.
