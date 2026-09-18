# WE CRM Form Validation Standards Matrix

This document outlines the strict validation standards enforced across all 24 Service Applications and the Complete Company Profile form. All fields are instantly validated upon keystroke to ensure data integrity and prevent submission of incorrectly formatted identifiers.

## Regex Validation Standards

| Field Type | Regex Pattern | Description |
| :--- | :--- | :--- |
| **Name** | `/^(?=.*[a-zA-Z])[a-zA-Z0-9\s\.\-]+$/` | Must contain ≥1 letter. Only alphanumeric, spaces, dots, hyphens. |
| **Model Number** | `/^[a-zA-Z0-9\s\.\-]+$/` | Alphanumeric, spaces, dots, hyphens allowed. No special symbols. |
| **Email** | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | Standard email format. |
| **Phone / Mobile** | `/^\d{10}$/` | Exactly 10 digits. |
| **PAN** | `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` | 5 uppercase letters, 4 digits, 1 uppercase letter. |
| **Aadhaar** | `/^\d{12}$/` | Exactly 12 digits. |
| **GSTIN** | `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/` | 15 chars standard GST format. |
| **CIN / LLPIN** | `/^([LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\|[A-Z]{3}-\d{4})$/i` | 21 chars starting with L or U (CIN), OR 8 chars (LLPIN e.g. AAA-1234). |
| **DIN** | `/^\d{8}$/` | Exactly 8 digits. |
| **TAN** | `/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/` | 4 uppercase letters, 5 digits, 1 uppercase letter. |
| **IFSC** | `/^[A-Z]{4}0[A-Z0-9]{6}$/` | 11 chars starting with 4 letters and a 0. |
| **UDYAM MSME** | `/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/` | Standard Udyam format (e.g. UDYAM-MH-18-0000001). |
| **PIN Code** | `/^\d{6}$/` | Exactly 6 digits. |
| **Bank Account** | `/^\d{9,18}$/` | Between 9 and 18 digits. |

---

## Form Input Fields Test Matrix

This matrix is designed for QA and Testing Teams to verify boundary conditions on all inputs.

| Display Label | Field Internal Name | UI Input Type | Validation Applied | ✅ Correct Example | ❌ Wrong Example (Should Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Company / Business Name | `companyName` | Text | Name | `Company 123` | `1223333` *(no letters)* |
| Director / Founder Name | `directorName` | Text | Name | `John Doe` | `John@Doe!` *(invalid chars)* |
| Company Email | `companyEmail` | Email | Email Format | `hello@example.com` | `hello@com` *(no tld)* |
| Director Email | `directorEmail` | Email | Email Format | `admin@brand.in` | `admin example.com` *(no @)* |
| Company Phone | `companyPhone` | Text | Phone (10 Digits) | `9876543210` | `987654321` *(9 digits)* |
| Director Mobile | `directorMobile` | Text | Phone (10 Digits) | `9988776655` | `+919988776655` *(contains +)* |
| Company PAN | `companyPan` | Text | PAN Format | `ABCDE1234F` | `ABCD12345F` *(4 letters start)* |
| Director PAN | `directorPan` | Text | PAN Format | `ABCDE1234F` | `12345ABCDE` *(starts w/ digits)* |
| Director Aadhaar | `directorAadhaar` | Text | Aadhaar (12 Digits) | `123456789012` | `12345678901` *(11 digits)* |
| Director DIN | `directorDin` | Text | DIN (8 Digits) | `12345678` | `1234567` *(7 digits)* |
| GSTIN | `gstin` | Text | GSTIN Format | `22AAAAA0000A1Z5` | `22AAAA0000A1Z5` *(missing char)* |
| CIN / LLPIN | `cin` | Text | CIN/LLPIN Format | `U12345AB1234CDE123456` or `AAA-1234` | `12345AB1234CDE1234567` *(must start L/U)*|
| Postal Code | `postalCode` | Text | PIN Code | `600001` | `60000` *(5 digits)* |
| Date of Incorporation | `incorporationDate`| Date | Browser Native Date | `01/01/2026` *(via calendar)*| `01/01/202` *(invalid date)* |
| Annual Turnover | `annualTurnover` | Dropdown | Selection Match | *(Selects from dropdown)* | *(Cannot type manually)* |
| Business Type | `businessType` | Text | Generic Text | `Pvt Ltd` | *(Empty if required)* |
| Nature of Business | `natureOfBusiness` | Text | Generic Text | `Manufacturing` | *(Empty if required)* |
| Registered Address | `registeredAddress`| Text | Generic Text | `123 Main St, Tech Park`| *(Empty if required)* |
| City | `city` | Text | Generic Text | `Mumbai` | *(Empty if required)* |
| State | `state` | Text | Generic Text | `Maharashtra` | *(Empty if required)* |
| Udyam / MSME Number | `udyamNumber` | Text | UDYAM MSME Format | `UDYAM-MH-18-0000001` | `UDYAM-MH-18-1234` *(too short)* |
| Trademark App No | `trademarkNo` | Text | Generic Text | `TM123456` | *(Empty if required)* |
| DPIIT Registration No | `dpiitRefNo` | Text | Generic Text | `DIPP12345` | *(Empty if required)* |
| ISO Certificate No | `isoCertNo` | Text | Generic Text | `ISO9001-2015` | *(Empty if required)* |
| Incorporation Cert | `incorpCert` | File | File Upload (5MB) | `cert.pdf` (2MB) | `video.mp4` (10MB) |
| Company PAN Card | `panCard` | File | File Upload (5MB) | `pan.jpg` (1MB) | `large.pdf` (8MB) |
| GST Certificate | `gstDoc` | File | File Upload (5MB) | `gst.png` (3MB) | `zipfile.zip` |
| Udyam Certificate | `udyamCert` | File | File Upload (5MB) | `msme.pdf` (500KB) | `large_image.png` (12MB) |
| Trademark Certificate | `trademarkCert` | File | File Upload (5MB) | `tm.pdf` (1MB) | `audio.mp3` |
| ISO Certificate | `isoCert` | File | File Upload (5MB) | `iso.jpg` (2MB) | `document.doc` (unsupported)|
| Model Number | `modelNumber` | Text | Model Number | `1234-A` | `@1234` *(invalid char)* |

> [!NOTE]
> Testing team: Please note that the regex validations are case-sensitive where appropriate. However, for PAN and GSTIN fields, the frontend automatically intercepts lowercase keystrokes and converts them to UPPERCASE on the fly before validation occurs.
