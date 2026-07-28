# PDF Preview Page

## Overview
The PDF Preview page allows you to see and iterate on the PDF report design in real-time before generating the actual PDF file.

## Access
- **URL**: `http://localhost:5174/pdf-preview`
- **Navigation**: Look for the orange "PDF Preview" link in the navigation bar (development only)

## Features

### Live Preview
- Real-time preview of the PDF report design
- Scaled to fit in the browser (60% scale)
- Matches the exact layout that will be generated in the PDF

### Interactive Controls
- **Company Name**: Edit the company name
- **Overall Score**: Adjust the compliance score (0-100)
- **Report Date**: Change the report date
- **Category Scores**: Edit individual category names, scores, and insights

### Actions
- **Generate PDF**: Creates and downloads the actual PDF file
- **Reset to Test Data**: Restores the default test data

## Design Elements

### Current Design Features
- **Modern gradient backgrounds** with subtle patterns
- **Dark header** with glassmorphism info card
- **Color-coded scoring** (red/yellow/green based on scores)
- **Professional typography** using Inter font family
- **Structured layout** with clear sections:
  - Header with branding and company info
  - Overall score with category breakdown
  - Strengths, red flags, and risk forecast
  - Recommended actions
  - Professional footer

## Making Design Changes

### Single Source of Truth
The design is now managed through a **shared template component**:

**📁 `/frontend/src/components/PDFReportTemplate.tsx`**

This is the **ONLY** place you need to make design changes. Both the preview and PDF generator use this same component.

### How to Make Changes
1. **Edit the template**: Open `/frontend/src/components/PDFReportTemplate.tsx`
2. **See changes instantly**: The preview page will update immediately
3. **Test PDF generation**: Use the "Generate PDF" button to ensure the PDF looks correct
4. **No manual syncing needed**: Changes automatically apply to both preview and PDF

### What You Can Customize
- Colors, fonts, and spacing
- Layout and positioning
- Background patterns and gradients
- Section content and structure
- Typography and sizing

## Technical Details
- **Shared Component**: `PDFReportTemplate` used by both preview and PDF generator
- **Inline Styles**: Required for PDF compatibility
- **Responsive Preview**: Scaled to 60% for browser viewing
- **Real-time Updates**: Changes reflect immediately in preview

## Usage Tips
1. **Start with test data** to see all design elements
2. **Adjust scores** to see different color schemes (80+ = green, 60+ = yellow, <60 = red)
3. **Test with long text** to check layout handling
4. **Generate PDFs frequently** to ensure design consistency
5. **Use browser dev tools** to inspect and debug styling

## File Structure
```
frontend/src/
├── components/
│   └── PDFReportTemplate.tsx    ← EDIT THIS for design changes
├── pages/
│   └── PDFPreviewPage.tsx       ← Preview interface (don't edit design here)
└── utils/
    └── pdfGenerator.ts          ← Uses PDFReportTemplate (don't edit design here)
```

## Next Steps
Once you're satisfied with the design:
1. **Remove navigation links** when moving to production
2. **Consider adding more customization options** as needed
3. **Test across different browsers** for PDF generation compatibility