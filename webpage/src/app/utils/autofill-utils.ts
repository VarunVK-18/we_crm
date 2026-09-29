import { DocumentMatcher } from './document-matcher';

export class AutoFillUtils {

  /**
   * Main autofill entry — now fetches EntityProfile from the backend first.
   * EntityProfile is the single source of truth updated on every form submission.
   * Falls back to the User model (from DealVoice seed) if EntityProfile is empty.
   */
  static async autoFillWithProfile(
    component: any,
    entityName: string,
    user: any,
    apiService: any // ApiService instance so we can call GET /entity-profile
  ) {
    try {
      const profileRes = await (apiService.get(`entity-profile?entityName=${encodeURIComponent(entityName)}`) as any).toPromise();
      const profile = profileRes?.profile;

      if (profile && Object.keys(profile).length > 0) {
        // --- EntityProfile (freshest data: updated on every form submit) ---
        this.setIfPropertyExists(component, ['companyName', 'companyLegalName', 'legalName', 'businessName', 'nameOfTheCompany', 'entityName', 'manufacturerName'], entityName);
        this.setIfPropertyExists(component, ['panOfBusiness', 'companyPan', 'panNumber', 'pan'],                    profile.pan);
        this.setIfPropertyExists(component, ['gst', 'gstNumber', 'gstin'],                         profile.gstin);
        this.setIfPropertyExists(component, ['address', 'companyAddress', 'businessAddress', 'officeAddress', 'courierAddress'], profile.address);
        this.setIfPropertyExists(component, ['tan', 'tanNumber'],                                  profile.tan);
        this.setIfPropertyExists(component, ['cin', 'cinNumber'],                                  profile.cin);
        this.setIfPropertyExists(component, ['incorporationDate', 'incorpDate', 'dateOfIncorporation'],                                 profile.incorporationDate);
        this.setIfPropertyExists(component, ['email', 'businessEmail', 'companyEmail'],            profile.email);
        this.setIfPropertyExists(component, ['phone', 'mobile', 'mobileNumber', 'contactNumber', 'whatsapp', 'businessPhone'],  profile.phone);
        this.setIfPropertyExists(component, ['bankAccount', 'bankAccountNumber', 'accountNumber'],                  profile.bankAccount);
        this.setIfPropertyExists(component, ['bankIfsc', 'ifscCode'],                              profile.bankIfsc);
        this.setIfPropertyExists(component, ['bankName'],                                          profile.bankName);

        // Director details from EntityProfile
        this.setIfPropertyExists(component, ['directorName', 'dir1FullName', 'ownerName', 'contactPerson', 'applicantName', 'signatoryName'],         profile.directorName);
        this.setIfPropertyExists(component, ['directorEmail', 'dir1Email', 'dir1Mail', 'signatoryEmail'],            profile.directorEmail);
        this.setIfPropertyExists(component, ['directorPhone', 'dir1Phone', 'dir1Mobile', 'signatoryMobile'],          profile.directorPhone);
        this.setIfPropertyExists(component, ['directorPan', 'dir1Pan'],                            profile.directorPan);
        this.setIfPropertyExists(component, ['directorDin', 'dir1Din'],                            profile.directorDin);
      } else {
        // Fallback: read from User model (DealVoice seed data)
        this.autoFillTextData(component, entityName, user);
      }
    } catch (_) {
      // If API fails, gracefully fall back to user model
      this.autoFillTextData(component, entityName, user);
    }
  }

  /** Legacy autofill from the User model — kept for backward compatibility. */
  static autoFillTextData(component: any, entityName: string, user: any) {
    if (!user) return;
    
    // 1. Try to find the exact or fuzzy matched entity from client_entities
    if (user.client_entities && user.client_entities.length > 0) {
      const matchedEntity = DocumentMatcher.findExistingEntity(entityName, user.client_entities);
      if (matchedEntity) {
        // Map entity fields to common component properties
        this.setIfPropertyExists(component, ['companyName', 'companyLegalName', 'legalName', 'businessName', 'nameOfTheCompany', 'entityName', 'manufacturerName'], entityName);
        this.setIfPropertyExists(component, ['panOfBusiness', 'companyPan', 'panNumber', 'pan'], matchedEntity.pan);
        this.setIfPropertyExists(component, ['gst', 'gstNumber', 'gstin'], matchedEntity.gstin);
        this.setIfPropertyExists(component, ['address', 'companyAddress', 'businessAddress', 'officeAddress', 'courierAddress'], matchedEntity.address || matchedEntity.registeredAddress);
        this.setIfPropertyExists(component, ['tan', 'tanNumber'], matchedEntity.tan);
        this.setIfPropertyExists(component, ['cin', 'cinNumber'], matchedEntity.cin);
        this.setIfPropertyExists(component, ['iso', 'isoNumber'], matchedEntity.iso);
        this.setIfPropertyExists(component, ['iec', 'iecCode', 'iecNumber'], matchedEntity.iec);
        this.setIfPropertyExists(component, ['incorporationDate', 'incorpDate', 'dateOfIncorporation'], matchedEntity.incorporationDate);
        this.setIfPropertyExists(component, ['msme', 'msmeNumber', 'udyamNumber'], matchedEntity.msme);
        this.setIfPropertyExists(component, ['lei', 'leiNumber'], matchedEntity.lei);
        this.setIfPropertyExists(component, ['fssai', 'fssaiNumber'], matchedEntity.fssai);
      }
    }

    // 2. Try to find the associated director details for personal info
    if (user.directors && user.directors.length > 0) {
      const mainDirector = user.directors[0];
      this.setIfPropertyExists(component, ['aadhaar', 'aadhaarNumber', 'ownerAadhaar'], mainDirector.aadhaar);
      this.setIfPropertyExists(component, ['directorName', 'dir1FullName', 'ownerName', 'contactPerson', 'applicantName', 'signatoryName'], mainDirector.ownerName || mainDirector.directorName);
      if (!component.panNumber && !component.pan && !component.panOfBusiness) {
         this.setIfPropertyExists(component, ['panOfBusiness', 'ownerPan', 'panNumber', 'pan'], mainDirector.pan);
      }
      this.setIfPropertyExists(component, ['mobile', 'mobileNumber', 'phone', 'contactNumber', 'whatsapp', 'businessPhone', 'signatoryMobile'], mainDirector.mobileNumber || mainDirector.phone);
      this.setIfPropertyExists(component, ['email', 'emailId', 'personalEmail', 'businessEmail', 'companyEmail', 'signatoryEmail'], mainDirector.email);
    }

    // Fallback to basic user profile details if director/entity info was missing
    this.setIfPropertyExists(component, ['directorName', 'dir1FullName', 'ownerName', 'contactPerson', 'applicantName', 'signatoryName'], user.owner_name);
    this.setIfPropertyExists(component, ['email', 'emailId', 'personalEmail', 'businessEmail', 'companyEmail', 'signatoryEmail'], user.email || user.company_email);
    this.setIfPropertyExists(component, ['mobile', 'mobileNumber', 'phone', 'contactNumber', 'whatsapp', 'businessPhone', 'signatoryMobile'], user.phone);
  }

  private static setIfPropertyExists(component: any, possibleNames: string[], value: any) {
    if (!value) return;
    const componentKeys = Object.keys(component);
    
    for (const name of possibleNames) {
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Look for a matching key in the component
      for (const compKey of componentKeys) {
        // Direct match or dynamic form nested path match (e.g. '2. Company Details.Company Legal Name')
        const normalizedCompKey = compKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedCompKey === normalizedName || normalizedCompKey.endsWith(normalizedName)) {
          // Only override if the field is empty to prevent erasing user input
          if (!component[compKey] || component[compKey] === '') {
            component[compKey] = value;
          }
          return; // Stop after finding the best match for these aliases
        }
      }
    }
  }
}
