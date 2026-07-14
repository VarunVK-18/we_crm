const fs = require('fs');
const file = 'c:/projects/we_crm/webpage/src/app/client/client-profile.html';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const newContent = `              <div class="directors-accordion-list" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
                @for (dir of (isEditing() ? editData.directors : filteredDirectors()); track $index) {
                   <div class="director-accordion-card" style="border: 1px solid var(--border); border-radius: 12px; background: white; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                      <!-- Header -->
                      <div class="director-card-header" 
                           style="display: flex; align-items: center; justify-content: space-between; padding: 20px; cursor: pointer; transition: background 0.2s;"
                           (click)="selectedDirectorIndex.set(selectedDirectorIndex() === $index ? -1 : $index)"
                           onmouseover="this.style.backgroundColor='#f8fafc'"
                           onmouseout="this.style.backgroundColor='transparent'">
                         <div style="display: flex; align-items: center; gap: 16px;">
                            <!-- Avatar -->
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: #f3e8ff; color: #7e22ce; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;">
                               {{ dir.fullName ? (dir.fullName.split(' ')[0][0] + (dir.fullName.split(' ').length > 1 ? dir.fullName.split(' ')[1][0] : '')).toUpperCase() : 'NA' }}
                            </div>
                            
                            <!-- Info -->
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                               <div style="display: flex; align-items: center; gap: 12px;">
                                  <span style="font-size: 16px; font-weight: 700; color: #0f172a;">{{ dir.fullName || 'Unnamed' }}</span>
                                  @if (dir.isAuthSignatory === 'Yes' || dir.isAuthorized === 'Yes') {
                                     <span style="background: #f3e8ff; color: #7e22ce; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase;">Authorized Signatory</span>
                                  } @else {
                                     <span style="background: #f3e8ff; color: #7e22ce; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase;">VERIFIED</span>
                                  }
                               </div>
                               <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
                                  <span style="color: #7e22ce; font-weight: 500;">{{ dir.role || 'Director And Shareholder' }}</span>
                                  <span>&bull;</span>
                                  <span>5 documents</span>
                               </div>
                            </div>
                         </div>
                         
                         <!-- Chevron -->
                         <span class="material-symbols-outlined" style="color: #7e22ce; transition: transform 0.3s;" [style.transform]="selectedDirectorIndex() === $index ? 'rotate(180deg)' : 'rotate(0)'">
                            expand_more
                         </span>
                      </div>

                      <!-- Body -->
                      @if (selectedDirectorIndex() === $index) {
                        <div class="director-card-body" style="padding: 20px; border-top: 1px solid var(--border); background: #fafafa;">
                           <div class="detail-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Name</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.fullName" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.fullName || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Role</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.role" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.role || 'Director' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Email</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.email" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.email || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Phone</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.phone" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.phone || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">PAN</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.pan" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.pan || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Aadhaar</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.aadhaar" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.aadhaar || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">DOB</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.dob" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.dob || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">DIN</label>
                               @if(isEditing()) {
                                 <input type="text" class="form-input" [(ngModel)]="dir.din" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px;" />
                               } @else {
                                 <div style="font-size: 14px; font-weight: 500; color: var(--palette-dark);">{{ dir.din || 'N/A' }}</div>
                               }
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Photo</label>
                               <div>
                                 @if (dir.photo) {
                                   <div class="image-preview-container">
                                     @if (isImage(dir.photo)) {
                                       <img [src]="api.getFileUrl(dir.photo)" class="preview-img" alt="Photo" />
                                     } @else {
                                       <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px;">
                                         <span class="material-symbols-outlined" style="font-size: 32px; color: var(--text-secondary);">description</span>
                                         <span style="font-size: 11px; margin-top: 4px; font-weight: 500; color: var(--text-secondary);">Document</span>
                                       </div>
                                     }
                                     <div class="image-overlay">
                                       <a href="javascript:void(0)" (click)="openDocViewer(dir.photo, dir.fullName + '-Photo', $event)" class="overlay-btn view-btn" title="View">
                                         <hugeicons-icon [icon]="EyeIcon" [size]="18" color="white" [strokeWidth]="2"></hugeicons-icon>
                                       </a>
                                       <a href="javascript:void(0)" (click)="downloadImage(api.getFileUrl(dir.photo), dir.fullName + '-Photo.jpg'); $event.preventDefault()" class="overlay-btn download-btn" title="Download">
                                         <hugeicons-icon [icon]="Download04Icon" [size]="18" color="white" [strokeWidth]="2"></hugeicons-icon>
                                       </a>
                                     </div>
                                   </div>
                                 } @else {
                                   <span style="font-size: 13px; color: #94a3b8;">N/A</span>
                                 }
                                 @if(isEditing()) {
                                   <div style="margin-top: 8px;">
                                     <label style="font-size: 11px; cursor: pointer; color: #4b5563; background: #f3f4f6; padding: 6px 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-weight: 600;">
                                       Upload Photo
                                       <input type="file" style="display: none;" (change)="uploadDirectorDocument($index, 'photo', $event)" accept="image/*" />
                                     </label>
                                   </div>
                                 }
                               </div>
                             </div>
                             <div class="detail-item">
                               <label style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Signature</label>
                               <div>
                                 @if (dir.signature) {
                                   <div class="image-preview-container">
                                     @if (isImage(dir.signature)) {
                                       <img [src]="api.getFileUrl(dir.signature)" class="preview-img" alt="Signature" />
                                     } @else {
                                       <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px;">
                                         <span class="material-symbols-outlined" style="font-size: 32px; color: var(--text-secondary);">description</span>
                                         <span style="font-size: 11px; margin-top: 4px; font-weight: 500; color: var(--text-secondary);">Document</span>
                                       </div>
                                     }
                                     <div class="image-overlay">
                                       <a href="javascript:void(0)" (click)="openDocViewer(dir.signature, dir.fullName + '-Signature', $event)" class="overlay-btn view-btn" title="View">
                                         <hugeicons-icon [icon]="EyeIcon" [size]="18" color="white" [strokeWidth]="2"></hugeicons-icon>
                                       </a>
                                       <a href="javascript:void(0)" (click)="downloadImage(api.getFileUrl(dir.signature), dir.fullName + '-Signature.jpg'); $event.preventDefault()" class="overlay-btn download-btn" title="Download">
                                         <hugeicons-icon [icon]="Download04Icon" [size]="18" color="white" [strokeWidth]="2"></hugeicons-icon>
                                       </a>
                                     </div>
                                   </div>
                                 } @else {
                                   <span style="font-size: 13px; color: #94a3b8;">N/A</span>
                                 }
                                 @if(isEditing()) {
                                   <div style="margin-top: 8px;">
                                     <label style="font-size: 11px; cursor: pointer; color: #4b5563; background: #f3f4f6; padding: 6px 12px; border-radius: 6px; border: 1px solid #e5e7eb; font-weight: 600;">
                                       Upload Signature
                                       <input type="file" style="display: none;" (change)="uploadDirectorDocument($index, 'signature', $event)" accept="image/*,application/pdf" />
                                     </label>
                                   </div>
                                 }
                               </div>
                             </div>
                           </div>
                        </div>
                      }
                   </div>
                }
              </div>`;

lines.splice(355, 178, newContent);

fs.writeFileSync(file, lines.join('\n'));
