import os
import re

forms_dir = r"c:\projects\we_crm\webpage\src\app\client\forms"

def process_ts(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add WeLoaderComponent import
    if "WeLoaderComponent" not in content:
        content = re.sub(
            r"(import .* from '@angular/core';\n)",
            r"\1import { WeLoaderComponent } from '../../../components/we-loader/we-loader';\n",
            content
        )

    # Add WeLoaderComponent to imports array
    content = re.sub(
        r"imports:\s*\[CommonModule,\s*FormsModule(,\s*[^\]]*)?\]",
        r"imports: [CommonModule, FormsModule\1, WeLoaderComponent]",
        content
    )

    # Add isSuccess = signal(false);
    if "isSuccess = signal" not in content:
        content = re.sub(
            r"(isSubmitting\s*=\s*signal(?:<boolean>)?\(false\);)",
            r"\1\n  isSuccess = signal(false);",
            content
        )

    # Replace alert and navigate with isSuccess
    # Match: alert('... successfully!');\n        this.draftService.clearDraft(...);\n        this.router.navigate(...);
    # or similar
    pattern = re.compile(
        r"alert\([^)]+\);\s*(this\.draftService\.clearDraft[^;]+;)?\s*this\.router\.navigate\(\['/client/service',[^\]]+\]\);",
        re.MULTILINE | re.DOTALL
    )
    
    def replacer(match):
        draft_clear = match.group(1) or ""
        return f"""this.isSuccess.set(true);
          {draft_clear}
          setTimeout(() => {{
            this.router.navigate(['/client/service', this.orderId()]);
          }}, 2000);"""

    content = pattern.sub(replacer, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def process_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add overlay at the end
    overlay_code = """
<!-- Full page overlays -->
@if (isSubmitting() || isSuccess()) {
  <div class="overlay-container">
    @if (isSubmitting()) {
      <app-we-loader></app-we-loader>
      <h3 style="color: white; margin-top: 24px; font-family: var(--font-heading);">Submitting Application...</h3>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Please wait while we process your documents</p>
    }
    @if (isSuccess()) {
      <div class="success-icon">
        <span class="material-symbols-outlined" style="font-size: 64px; color: #10b981;">check_circle</span>
      </div>
      <h3 style="color: white; margin-top: 24px; font-family: var(--font-heading);">Application Submitted Successfully!</h3>
      <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Redirecting to tracking page...</p>
    }
  </div>
}
"""
    if "overlay-container" not in content:
        content += overlay_code

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def process_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    css_code = """
.overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

.success-icon {
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
"""
    if "overlay-container" not in content:
        content += css_code

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


for root, dirs, files in os.walk(forms_dir):
    for file in files:
        path = os.path.join(root, file)
        if file.endswith('.ts') and not file.endswith('.spec.ts'):
            process_ts(path)
        elif file.endswith('.html'):
            process_html(path)
        elif file.endswith('.css'):
            process_css(path)

print("Done updating all forms!")
