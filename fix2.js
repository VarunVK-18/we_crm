const fs = require('fs');
let html = fs.readFileSync('c:/projects/we_crm/webpage/src/app/client/client-profile.html', 'utf8');

const brokenPart = `              @if (!user()?.pan_file && !user()?.gstin_file && filteredDocuments().length === 0) {
                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" (click)="toggleEdit()">
                  {{ isEditing() ? 'Cancel' : 'Edit Directors' }}
                </button>`;

const fixedPart = `              @if (!user()?.pan_file && !user()?.gstin_file && filteredDocuments().length === 0) {
                <div class="empty-docs">
                  <span class="material-symbols-outlined">folder_open</span>
                  <p>{{ selectedEntity() !== 'All' ? 'No documents for ' + selectedEntity() : 'No documents uploaded yet.' }}</p>
                </div>
              }
            </div>
          </div>
          
        }
          
        <!-- Directors Section -->
        @if (activeTab() === 'directors') {
          <div class="profile-card directors-card" style="grid-column: 1 / -1;">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h2>Directors &amp; Partners</h2>
                </div>
                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;" (click)="toggleEdit()">
                  {{ isEditing() ? 'Cancel' : 'Edit Directors' }}
                </button>`;

html = html.replace(brokenPart, fixedPart);

fs.writeFileSync('c:/projects/we_crm/webpage/src/app/client/client-profile.html', html);
