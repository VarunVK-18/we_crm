const fs = require('fs');

const path = 'webpage/src/app/client/client-profile.html';
let content = fs.readFileSync(path, 'utf8');

const regex = /@for\s*\(\s*doc\s*of\s*filteredDocuments\(\);\s*track\s*doc\._id\s*\)\s*\{[\s\S]*?<!-- Additional onboarding documents array -->\s*@for\s*\(doc\s*of\s*filteredDocuments\(\);\s*track\s*doc\._id\)\s*\{[\s\S]*?\}\s*\}/;

const replacementFull = `              <!-- Additional onboarding documents array -->
              @for (category of categorizedDocuments(); track category.title) {
                <div class="elegant-section-group" style="margin-top: 24px; margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
                  {{ category.title }}
                </div>
                @for (doc of category.docs; track doc._id) {
                  <!-- Skip duplicates if they are already handled above based on naming, otherwise show them -->
                  @if (doc.name !== 'PAN Card Verification') {
                    <div class="document-item">
                      <div class="doc-icon-box">
                        <hugeicons-icon [icon]="File01Icon" [size]="20" color="var(--palette-purple)" [strokeWidth]="2"></hugeicons-icon>
                      </div>
                      <div class="doc-info">
                        <span class="doc-name" [title]="doc.name">{{ doc.name }}</span>
                        @if (doc.uploadedAt) {
                          <span class="doc-date">{{ doc.uploadedAt | date:'dd/MM/yy' }}</span>
                        }
                      </div>
                      <div class="doc-actions">
                        <a href="javascript:void(0)" (click)="openDocViewer(doc.fileUrl, doc.name, $event, doc)" class="action-btn" title="View Document">
                          <hugeicons-icon [icon]="EyeIcon" [size]="18" color="currentColor" [strokeWidth]="1.5"></hugeicons-icon>
                        </a>
                        <a href="javascript:void(0)" (click)="downloadImage(api.getFileUrl(doc.fileUrl), doc.name, doc); $event.preventDefault()" class="action-btn" title="Download Document">
                          @if (activeLoadingAction() === 'download-' + doc.name) {
                            <hugeicons-icon [icon]="Loading02Icon" [size]="18" color="currentColor" [strokeWidth]="1.5" style="animation: spin 1s linear infinite;"></hugeicons-icon>
                          } @else {
                            <hugeicons-icon [icon]="Download04Icon" [size]="18" color="currentColor" [strokeWidth]="1.5"></hugeicons-icon>
                          }
                        </a>
                      </div>
                    </div>
                  }
                }
              }`;

// Since regex is hard to get right with nested braces, I'll just find the exact string via view_file if I need to.
// I will just replace everything from `<!-- Additional onboarding documents array -->` to `@if (!user()?.pan_file && !user()?.gstin_file && filteredDocuments().length === 0)`

const startIndex = content.indexOf('<!-- Additional onboarding documents array -->');
const endIndex = content.indexOf('@if (!user()?.pan_file && !user()?.gstin_file && filteredDocuments().length === 0)');

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + replacementFull + '\n              ' + content.substring(endIndex);
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('Replaced successfully using indices!');
} else {
  console.log('Could not find start or end index.');
}
