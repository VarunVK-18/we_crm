# WE-CRM Backend (`crm_backend`) Complete Code Review & Architectural Report

**Date**: July 2026  
**Repository**: `/Users/yovelr/Softrate/we-crm/we_crm/crm_backend`  
**Framework**: Node.js, Express 5.x, Mongoose 9.x, MongoDB Atlas / Self-Hosted

---

## 1. Executive Summary

The **WE-CRM Backend** (`crm_backend`) serves as the API and data persistence layer for the WE-CRM suite (including web dashboards, mobile CRM app, compliance radar, and admin CRM workspaces).

### Key Highlights
- **27 MongoDB Models**: Comprehensive modeling of multi-tenant companies, hierarchical staff/client users, service workflows, compliance tasks, statutory filings, customer support tickets, DSC hardware token tracking, document storage, and notifications.
- **Security & Multi-Tenancy**: Scopes data by `company_id` across primary models (`User`, `ServiceOrder`, `Checklist`, `ComplianceTask`, `Team`, `Subscription`). Uses AES-256-GCM encryption (`utils/encryption.js`) for sensitive client statutory credentials (MCA, GST, ITR, DPIIT, TDS, PF) stored in `ServiceDetails`.
- **Integrations**: Supports Firebase Admin SDK for authentication and push notifications (`fcm_token`), DealVoice for lead bucket requests, and Gemini / OCR (`tesseract.js`, `pdf-parse`) for automated document extraction.

---

## 2. Model & Category Architecture Review

| Category / Domain | Primary Models | Review Status | Key Findings & Observations |
|---|---|---|---|
| **Multi-Tenancy & Auth** | `Company`, `User`, `Team` | ✅ Robust | `User` schema supports both staff roles (`admin`, `account_manager`, `filling_staff`, `client_manager`) and customer roles (`customer`). Rich sub-schemas for `client_entities` and `directors`. Recommended index: Ensure compound index `{ company_id: 1, role: 1 }` is utilized for frequent filtering. |
| **Service Workflow** | `ServiceOrder`, `ServiceDetails`, `Checklist`, `ChecklistTemplate` | ✅ Excellent | Highly flexible step-based execution (`steps` array in `ServiceOrder`). Encrypted credential storage in `ServiceDetails` properly uses Mongoose getters/setters. `Checklist` supports bill reimbursements and custom staff inputs. |
| **Compliance & Filings** | `ComplianceTask`, `FilingTask`, `ComplianceCalendar`, `ComplianceReminder`, `RenewalHistory`, `Subscription` | ✅ Well-Structured | Supports warning statuses (`Upcoming`, `Due Soon`, `Critical`, `Overdue`, `Completed`). Indexes on `{ companyId: 1, dueDate: 1 }` ensure fast dashboard queries. |
| **Document Management** | `Document`, `DocumentTemplate`, `Certificate` | ✅ Flexible | `Document` stores actual file data as `Buffer` in MongoDB or links to `/uploads/` file paths. OCR parsing endpoint exists for incorporation certificates. |
| **Customer Support** | `Ticket` | ✅ Solid | Auto-increments incident IDs (`INC1001`, `INC1002`) using `GlobalCounter`. |
| **DSC Token Lifecycle** | `DscOrder`, `DscToken`, `DscTokenLog` | ✅ Complete | Full tracking of physical USB tokens, pin codes, expiry dates, and checkout logs. |
| **Lead Intake & Buckets** | `BucketRequest` | ✅ Integrated | Seamlessly bridges external lead sources (`dealvoice`, `manual`, `we-crm`) with internal `Checklist` creation. |
| **Engagement & Auditing** | `Message`, `Notification`, `Banner`, `AuditLog`, `Counter`, `GlobalCounter` | ✅ Solid | Tracks staff and client actions in `AuditLog`. Promotes features via `Banner`. |

---

## 3. Detailed Code Review by Component

### 3.1. Authentication, Security & Encryption (`authController.js`, `utils/encryption.js`)
- **Strengths**:
  - `UserSchema.pre('save')` correctly salts and hashes passwords using `bcryptjs` only when modified.
  - Sensitive client credentials in `ServiceDetails` use AES-256-GCM encryption with `CRED_ENCRYPT_KEY` via getters and setters.
  - Multi-tenant company onboarding sets default fee structures and bank accounts.
- **Recommendations**:
  - **Token Expire Handling**: Ensure JWT or Firebase ID token verification is uniformly enforced across all authenticated endpoints.
  - **Password Null Handling**: In `UserSchema`, password field setter correctly handles undefined/null values by defaulting to an empty string for OAuth/Firebase users.

### 3.2. File Uploads & Document Serving (`routes/documentRoutes.js`, `server.js`)
- **Strengths**:
  - In `server.js`, custom middleware for `/uploads` uses `fs.openSync` to inspect buffer magic bytes (`0x25 0x50 0x44 0x46` for PDF, JPEG/PNG signatures) and dynamically set appropriate `Content-Type` and `Content-Disposition: inline` headers.
  - `Document` model supports both database buffer storage and filesystem paths.
- **Recommendations**:
  - Ensure sample fallback files exist in `/uploads/` so that demo file references (e.g. `demo_coi.pdf`, `demo_gstin.pdf`) return valid 200 OK responses during testing.

### 3.3. API Controllers & Routes (`controllers/`, `routes/`)
- **Strengths**:
  - Controllers are cleanly modularized (`checklistController.js`, `orderController.js`, `complianceController.js`, etc.).
  - Proper error wrapping and HTTP status codes (`400`, `404`, `500`).
- **Recommendations**:
  - Add request validation middleware (e.g., Joi or Zod) on critical POST/PUT endpoints to prevent malformed payload injection.

---

## 4. Seeding Strategy & Best Practices

To provide an authentic, production-grade test environment:
1. **Realistic Client Naming Variation**:
   - Short Names (`Ana Li`, `Raj Rao`, `Dev Om`, `Samy Wu`, `Leo Ma`)
   - Medium Names (`Ananya Sharma`, `Vikramaditya Varma`, `Aarav Nambiar`, `Sneha Mukherjee`)
   - Long / Extended Names (`Venkatasubramanian Ramachandran-Nair`, `Thiruvananthapuram Balasubramanian Krishnamurthy`, `Chandrasekhara Venkata Ramanathan-Iyer`)
2. **Realistic Email Diversity**:
   - Short Emails (`raj@co.in`, `ana@we.in`, `dev@x.in`)
   - Long Emails (`venkatasubramanian.ramachandran.nair@enterprisesolutions.co.in`, `thiruvananthapuram.krishnamurthy@globalbiotechindia.com`)
3. **Valid PDF & PNG Demo Buffers**:
   - Embed real PDF 1.4 objects into MongoDB `Document` records and save to disk in `uploads/` so browsers render actual documents when tested.
4. **Complete Coverage**:
   - Populate 100 to 150 interconnected entries per collection across all 27 models.
