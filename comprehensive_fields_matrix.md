# Comprehensive Fields Validation Matrix

This document contains all 376 unique fields extracted from across all 24 database schemas and the Complete Company Profile.

| Internal Name | Display Label | UI Type | Validation Rule | ✅ Correct Example | ❌ Wrong Example (Should Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `aadhaar` | Aadhaar Number | text | **Aadhaar (12 Digits)** | `123456789012` | `12345678901 *(11 digits)*` |
| `aadhaarCard` | Aadhaar Card | file | **Aadhaar (12 Digits)** | `123456789012` | `12345678901 *(11 digits)*` |
| `aadhaarDoc` | Aadhaar Card | file | **Aadhaar (12 Digits)** | `123456789012` | `12345678901 *(11 digits)*` |
| `aadhaarNumber` | Aadhaar Number | number | **Aadhaar (12 Digits)** | `123456789012` | `12345678901 *(11 digits)*` |
| `accountHolderName` | Account Holder Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `accountNumber` | Account Number | number | **Bank Account** | `123456789012` | `12345678 *(8 digits)*` |
| `accountType` | Account Type | dropdown | **Bank Account** | `123456789012` | `12345678 *(8 digits)*` |
| `address` | Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `addressProof` | Business Address Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `addressType` | Business Address Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `advanceTaxPaid` | Advance Tax Paid | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `alreadyDirector` | Already a Director in another company? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `annualRevenue` | Annual Revenue (Approx) | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `annualTurnover` | Annual Turnover | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `aoa` | Articles of Association (AOA) | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `applicantAadhaar` | Applicant Aadhaar Card | file | **Aadhaar (12 Digits)** | `123456789012` | `12345678901 *(11 digits)*` |
| `applicantAddress` | Applicant Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `applicantAddressProof` | Applicant Address Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `applicantDob` | Applicant Date of Birth | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `applicantEmail` | Applicant Email | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `applicantFirstName` | First Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `applicantIdProof` | Applicant ID Proof (PAN/Aadhaar) | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `applicantLastName` | Last Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `applicantMail` | Applicant Mail ID / Office Mail ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `applicantMobile` | Mobile No | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `applicantName` | Applicant Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `applicantPan` | Applicant PAN Card | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `applicantPanNumber` | Applicant PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `applicantPhone` | Applicant Phone Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `applicantPhoto` | Applicant Photo | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `applyingFor` | I'm applying for | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `assessmentYear` | Assessment Year | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `authLetter` | Authorization Letter | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `authorAddress` | Author Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `authorizationLetter` | Authorization Letter / Board Resolution | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `authorizedAddress` | Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `authorizedEmail` | Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `authorizedMobile` | Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `authorizedPan` | PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `authorizedPersonName` | Authorized Person Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `authorName` | Author Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `authSignatoryProof` | Authorized Signatory ID Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `awardDetails` | Provide Award Details | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `awardsReceived` | Received any Awards? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `bankAccountHolderName` | Bank Account Holder Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `bankAccountNumber` | Bank Account Number | text | **Bank Account** | `123456789012` | `12345678 *(8 digits)*` |
| `bankDocument` | Bank Statement / Cancelled Cheque / Passbook | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `bankInterestIncome` | Bank Interest Income | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `bankName` | Bank Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `bankStatement` | Bank Statement | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `bankStatements` | Bank Statements (Current Account) | file | **Bank Account** | `123456789012` | `12345678 *(8 digits)*` |
| `bom` | Bill of Materials (BOM) | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `businessActivity` | Business Activity | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `businessAddress` | Business Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `businessAddressProof` | Business Address Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `businessConstitution` | Business Constitution | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `businessDescription` | Nature of Business Activity | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `businessDistrict` | District | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `businessEmail` | Business Email | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `businessIncome` | Business / Professional Income | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `businessName` | Name of Business | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `businessPanNumber` | Business PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `businessPhone` | Business Phone Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `businessPinCode` | PIN Code | number | **PIN Code (6 Digits)** | `600001` | `60000 *(5 digits)*` |
| `businessProof` | Business Address Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `businessStartDate` | Business Start Date | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `businessState` | State | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `businessType` | Business Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `businessTypeOther` | Other Business Type | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `cancellationReasonType` | Reason for Cancellation | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `cancelledCheque` | Cancelled Cheque | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `capital` | Fixed Capital Contribution | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `categoryOfMark` | Category of Mark | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `certificateOfIncorporation` | Certificate of Incorporation | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `certificationType` | Certification Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `cin` | CIN (Corporate Identification Number) | text | **CIN/LLPIN** | `U12345AB1234CDE123456` | `12345AB1234CDE1234567 *(must start L/U)*` |
| `cinLlpinNumber` | CIN / LLPIN Number | text | **CIN/LLPIN** | `U12345AB1234CDE123456` | `12345AB1234CDE1234567 *(must start L/U)*` |
| `cinNumber` | CIN Number | text | **CIN/LLPIN** | `U12345AB1234CDE123456` | `12345AB1234CDE1234567 *(must start L/U)*` |
| `circuitDiagram` | Circuit Diagram / PCB Details | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `city` | City | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `coi` | Certificate of Incorporation | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `companyAddress` | Company Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `companyBrief` | Brief About Company / Startup | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `companyEmail` | Company Email | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `companyLegalName` | Company Legal Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `companyLogo` | Company Logo | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `companyMailId` | Company Mail ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `companyMobile` | Company Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `companyMobileNumber` | Company Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `companyName` | Company Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `companyPan` | Company PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `companyPanFile` | Company / Firm PAN Card | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `companyPanName` | Company PAN Card Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `companyPanNumber` | Company PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `companyPhone` | Company Phone Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `companyWebsite` | Company Website | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `consent` | By submitting this form, I agree to the collection and use of my personal and professional information by Wealth Empires for consultation, compliance assessment, and service-related communication | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `constitutionType` | Constitution of Business | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `contactNumber` | Director Phone Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `contactPerson` | Contact Person Details | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `copyOfWork` | Copy of the Work | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `corrAddress` | Correspondence Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `country` | Country | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `courierAddress` | Address for couriering the ISO Certificate | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `dateFirstUsed` | Date of Trade / Brand Name First Used / Date of Company Incorporation | date | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `dateOfIncorporation` | Date of Incorporation | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `declaration` | I hereby declare that the work is original and all information provided is true and correct. | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `deductorType` | TDS Deductor Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `designation` | Designation | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `din` | DIN Number | text | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `dir1Address` | Residential Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `dir1AuthSignatory` | Is Authorized Signatory? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `dir1AuthSignatoryDoc` | Authorized Signatory Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `dir1Din` | DIN (If applicable) | text | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `dir1Dob` | Date of Birth | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `dir1FatherName` | Father's Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `dir1FullName` | Full Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `dir1Gender` | Gender | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `dir1Mail` | Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `dir1Pan` | PAN | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `dir1Phone` | Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `dir1Photo` | Photograph | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `dir2Address` | Residential Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `dir2AuthSignatory` | Is Authorized Signatory? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `dir2AuthSignatoryDoc` | Authorized Signatory Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `dir2Din` | DIN (If applicable) | text | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `dir2Dob` | Date of Birth | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `dir2FatherName` | Father's Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `dir2FullName` | Full Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `dir2Gender` | Gender | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `dir2Mail` | Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `dir2Pan` | PAN | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `dir2Phone` | Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `dir2Photo` | Photograph | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `directorAadhaar` | Director Aadhaar | text | **Aadhaar (12 Digits)** | `123456789012` | `12345678901 *(11 digits)*` |
| `directorAddress` | Director Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `directorAddressProofDoc` | Director Address Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `directorDin` | DIN | text | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `directorDob` | Date of Birth | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `directorEmail` | Director Email | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `directorFatherName` | Father Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `directorFirstName` | Director First Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `directorGender` | Gender | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `directorLastName` | Director Last Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `directorMobile` | Director Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `directorName` | Founder / Director Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `directorPan` | Director PAN | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `directorPanDob` | Director 1 PAN DOB | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `directorPanDoc` | Director PAN Card | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `directorPanName` | Director 1 PAN Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `directorPanNumber` | Director 1 PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `directorPersonalEmail` | Personal Mail ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `directorPhoneNumber` | Phone Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `district` | District | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `divyang` | Specially Abled (DIVYANG)? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `dob` | DOB | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `doorNumber` | Door / Building Number | text | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `dpiitRefNo` | DPIIT Registration Number | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `drawingsDiagrams` | Drawings / Diagrams | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `ebBill` | Electricity Bill | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `education` | Education | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `effectiveCancellationDate` | Effective Cancellation Date | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `eligibleItc` | Eligible ITC | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `email` | Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `emailId` | Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `employeeCount` | Current Number of Employees | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `employeeDetails` | Employee Details (Optional) | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `employees` | No. of Employees | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `enterpriseName` | Name of Enterprise | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `entityType` | Entity Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `entrepreneurName` | Name of Entrepreneur | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `exemptSales` | Exempt Sales | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `fatherName` | Father's name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `femaleEmployees` | No. of Female Employees | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `financialYear` | Financial Year | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `form16` | Form 16 / Salary Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `form26as` | Form 26AS / AIS | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `fullName` | Company / Applicant Full Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `fundingDetails` | Provide Funding Details | text | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `fundsReceived` | Received any Funds? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `gender` | Gender | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `grossTotalIncome` | Gross Total Income | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `gstCert` | GST Registration Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `gstCertificate` | GST Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `gstDoc` | GST Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `gstDocument` | GST Document | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `gstin` | GSTIN | text | **GSTIN (15 chars)** | `22AAAAA0000A1Z5` | `22AAAAA0000A1Z *(14 chars)*` |
| `gstNumber` | GST Number | text | **GSTIN (15 chars)** | `22AAAAA0000A1Z5` | `22AAAAA0000A1Z *(14 chars)*` |
| `hasAdditionalPlaces` | Do you have additional places of business? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `hasDirector2` | Add another Director/Promoter? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `hasDirectorDetails` | Add Director Details? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `hasGst` | Do you have GSTIN? | dropdown | **GSTIN (15 chars)** | `22AAAAA0000A1Z5` | `22AAAAA0000A1Z *(14 chars)*` |
| `hasGstin` | Do you already have GSTIN? | dropdown | **GSTIN (15 chars)** | `22AAAAA0000A1Z5` | `22AAAAA0000A1Z *(14 chars)*` |
| `hasShopAct` | Do you have Shop & Establishment Registration? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `hasUdyam` | Do you already have MSME/Udyam Registration? | dropdown | **UDYAM MSME** | `UDYAM-MH-18-0000001` | `UDYAM-MH-18-123 *(too short)*` |
| `identityProof` | Identity Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `ifsc` | IFSC Code | text | **IFSC Format** | `HDFC0001234` | `HDFC0123456 *(must have 0 at 5th)*` |
| `ifscCode` | IFSC Code | text | **IFSC Format** | `HDFC0001234` | `HDFC0123456 *(must have 0 at 5th)*` |
| `incorpCert` | Incorporation Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `incorpDate` | Date of Incorporation | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `incorporationDate` | Date of Incorporation | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `industryCategory` | Industry Category | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `inputGst` | Input GST / ITC | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `inventionDescription` | Invention Description | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `inventionDescriptionDoc` | Invention Description | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `inventionTitle` | Invention Title | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `inventorAddress` | Inventor Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `inventorName` | Inventor Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `inventorNames` | Inventor Name(s) | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `inventorNationality` | Nationality | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `investment` | Total Investment Made in Business (₹) | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `iprApplied` | Applied for IPR? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `iprDetails` | Provide IPR Details | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `isApplicantAuthor` | Is the Applicant the Author of the work? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `isAuthorized` | I'm Authorized signatory | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `isAuthSignatory` | I'm Authorized signatory | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `isCaterer` | Caterer | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isCorrespondenceSame` | Is your correspondence Address same as Address of Premises? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `isDeclared` | I hereby verify that the above mentioned facts are true and correct to the best of my knowledge. | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isDistributor` | Distributor | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isEcommerce` | E-commerce Food Seller | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isExporter` | Exporter | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isImporter` | Importer | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isManufacturer` | Manufacturer | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isoCert` | ISO Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `isoCertNo` | ISO Certificate Number | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `isOperating` | Is the business already operating? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `isOtherNature` | Other | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isRestaurant` | Restaurant / Food Service | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isRetailer` | Retailer | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isStorage` | Storage / Warehouse | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isTrader` | Trader | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isTransporter` | Transporter | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isVerified` | I hereby verify that above mentioned facts are true and correct to best of my knowledge and belief | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `isWholesaler` | Wholesaler | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `landlordName` | Landlord / Owner Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `language` | Language of the Work | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `leaseDetails` | Rent / Lease Agreement details | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `legalBusinessName` | Legal Business Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `legalName` | Legal Name of Business | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `mainProducts` | Main Products / Services | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `majorActivity` | Major Activity of Unit | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `maleEmployees` | No. of Male Employees | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `manufacturerName` | Company Legal Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `mcaPassword` | MCA Password | password | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `mcaUsername` | MCA Username | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `moa` | Memorandum of Association (MOA) | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `mobile` | Mobile Number (WhatsApp) | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `mobileNumber` | Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `modelNumber` | Model Number | text | **Model Number** | `MDL-1234` | `MDL@1234 *(special char)*` |
| `msmeCertificate` | Upload MSME Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `msmeType` | MSME Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `nameOnCompanyPan` | Name on Company PAN | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `nationality` | Nationality | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `natureOfBusiness` | Nature of Business | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `natureOfPayments` | Nature of Payments / TDS Applicable On | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `needDsc` | I need DSC | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `nilRatedSales` | Nil Rated Sales | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `nocFromAuthor` | NOC from Author | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `numberOfEmployees` | Number of Employees | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `numberOfShares` | No. of Shares | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `occupation` | Select the occupation | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `officeAddress` | Office Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `officeName` | Office Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `officePreference` | Registered Office Preference | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `officeProofPath` | Registered Office Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `officialEmail` | Official Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `optFssai` | FSSAI Registration / License | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `optGst` | GST Registration | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `optIec` | IEC Registration | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `optMsme` | MSME / Udyam Registration | dropdown | **UDYAM MSME** | `UDYAM-MH-18-0000001` | `UDYAM-MH-18-123 *(too short)*` |
| `optShopAct` | Shop & Establishment Registration | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `organizationName` | Organization Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `organizationPan` | Organization PAN | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `organizationType` | Organization Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `orgDsc` | Organization DSC Available? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `otherBusinessType` | Other Type of Business | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `otherDirectorPan` | Other Director PAN | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `otherIncome` | Other Income | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `otherIsoCertification` | Specify Other ISO Certification | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `otherNature` | Other Nature of Food Business | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `outputGst` | Output GST | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `ownerName` | Name of Owner in Utility Bill | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `paidUpCapital` | Paid up Share Capital | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `pan` | PAN | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `panCard` | PAN Card of Company | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `panDob` | Date of Birth / Incorporation as per PAN | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `panDoc` | PAN Card | file | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `panHolderName` | Name of PAN Holder | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `panNumber` | PAN Number of the Business | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `panOfBusiness` | PAN of Business | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `partnersName` | Partners Name if Partnership Firm | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `passportPhoto` | Passport Size Photo | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `paymentScreenshot` | Payment Screenshot | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `phone` | Phone number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `photo` | Photo | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `pinCode` | PIN Code | number | **PIN Code (6 Digits)** | `600001` | `60000 *(5 digits)*` |
| `placeOfBirth` | Place of birth | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `postalCode` | Postal Code | text | **PIN Code (6 Digits)** | `600001` | `60000 *(5 digits)*` |
| `preferredIsoCertification` | Preferred ISO Certification | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `premisesAddress` | Address of Premises | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `premisesType` | Premises Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `previousItr` | Previous Year ITR | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `productDatasheet` | Product Datasheet | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `productImages` | Product Images | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `productName` | Product Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `productSpecs` | Product Specifications (Voltage, Power, etc.) | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `profitRatio` | Profit sharing ratio (%) | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `propertyTaxReceipt` | Property Tax Receipt | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `purchaseBills` | Purchase Bills | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `reasonForCancellation` | Additional Details / Specific Reason | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `registeredAddress` | Registered Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `rentalAgreement` | Rental/Lease Agreement | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `repEmail` | Authorized Representative Email | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `repMobile` | Authorized Representative Mobile | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `repName` | Authorized Representative Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `residentialAddress` | Residential Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `residentialProof` | Residential Address Proof | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `returnPeriod` | Return Period / Tax Period | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `returnType` | Return Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `reverseCharge` | Reverse Charge | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `role` | Select your role | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `salaryIncome` | Salary Income | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `salesInvoice` | Sales Invoice Copies of Last FY | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `salesInvoices` | Sales Invoice Copies | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `secondPlaceAddress` | Second Place Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `selfAssessmentTaxPaid` | Self Assessment Tax Paid | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `shareholding` | Share holding percentage | number | **DIN (8 Digits)** | `12345678` | `1234567 *(7 digits)*` |
| `shopActNumber` | Registration Number | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `signatoryDesignation` | Designation | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `signatoryDob` | PAN Date of Birth | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `signatoryEmail` | Email ID | email | **Email Format** | `user@domain.com` | `user@domain *(no TLD)*` |
| `signatoryFirstName` | PAN First Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `signatoryLastName` | PAN Last Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `signatoryMobile` | Mobile Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `signatoryName` | Full Name | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `signatoryPan` | PAN of Authorized Signatory | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `signatoryPanNumber` | Signatory PAN Number | text | **PAN Format** | `ABCDE1234F` | `ABCD12345F *(starts with 4 letters)*` |
| `signature` | Signature | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `socialCategory` | Social Category | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `startDate` | When did your business start? | date | **Browser Native Date** | `01/01/2026` | `32/13/2026 *(invalid date)*` |
| `state` | State | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `street` | Street / Area | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `supportDocs` | Supporting Documents | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `tanAvailable` | TAN Available? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `tanCertificate` | TAN Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `tanNumber` | TAN Number | text | **TAN Format** | `ABCD12345E` | `ABCDE1234F *(5 letters)*` |
| `taxableSales` | Taxable Sales | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `taxpayerType` | Taxpayer Type | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `tdsDeducted` | TDS Deducted | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `testReports` | Existing Test Reports/Certificates | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `thirdPlaceAddress` | Third Place Address | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `totalBusinessTurnover` | Total Business Turnover | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `totalCapital` | Total Capital Contribution | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `totalPurchases` | Total Purchases | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `totalSales` | Total Sales / Turnover | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `tradeDescription` | Trade Description | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `trademarkCert` | Trademark Certificate | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `trademarkLogo` | Trademark Logo | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `trademarkNo` | Trademark Application / Cert Number | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `tradeName` | Trade Name (if any) | text | **Name (≥1 Letter)** | `John Doe` | `12345 *(no letters)*` |
| `treds` | Interested in TReDS Portal Registration? | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `turnover` | Turnover in Last FY | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `udyamCert` | UDYAM MSME Certificate | file | **UDYAM MSME** | `UDYAM-MH-18-0000001` | `UDYAM-MH-18-123 *(too short)*` |
| `udyamNumber` | Udyam Registration Number | text | **UDYAM MSME** | `UDYAM-MH-18-0000001` | `UDYAM-MH-18-123 *(too short)*` |
| `unitEntrancePhoto` | Photographs of the Unit (Entrance) | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `userManual` | User Manual | file | **File Upload (5MB)** | `file.pdf (2MB)` | `video.mp4 (10MB)` |
| `valuePerShare` | Value Per Share | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `verification` | I hereby verify that the above-mentioned facts are true and correct to the best of my knowledge and belief. | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `verificationStatus` | I hereby verify that the above mentioned facts are true and correct to the best of my knowledge and belief. | checkbox | **Boolean** | `Checked` | `Unchecked (if required)` |
| `websiteUrl` | Website URL | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `whatsapp` | WhatsApp Number | phone | **Phone (10 Digits)** | `9876543210` | `987654321 *(9 digits)*` |
| `workDescription` | Brief Description of the Work | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `workTitle` | Title of the Work | text | **Generic Text** | `Any valid text string` | `Empty (if required)` |
| `workType` | Type of Work | dropdown | **Selection** | `Option A` | `Cannot type manually` |
| `yearOfEstablishment` | Year of Establishment | number | **Generic Text** | `Any valid text string` | `Empty (if required)` |
