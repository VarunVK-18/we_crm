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
        this.setIfPropertyExists(component, ['panNumber', 'pan', 'companyPan'],                    profile.pan);
        this.setIfPropertyExists(component, ['gst', 'gstNumber', 'gstin'],                         profile.gstin);
        this.setIfPropertyExists(component, ['address', 'companyAddress', 'businessAddress', 'officeAddress'], profile.address);
        this.setIfPropertyExists(component, ['tan', 'tanNumber'],                                  profile.tan);
        this.setIfPropertyExists(component, ['cin', 'cinNumber'],                                  profile.cin);
        this.setIfPropertyExists(component, ['incorporationDate'],                                 profile.incorporationDate);
        this.setIfPropertyExists(component, ['email', 'businessEmail', 'companyEmail'],            profile.email);
        this.setIfPropertyExists(component, ['phone', 'mobile', 'mobileNumber', 'contactNumber'],  profile.phone);
        this.setIfPropertyExists(component, ['bankAccount', 'bankAccountNumber'],                  profile.bankAccount);
        this.setIfPropertyExists(component, ['bankIfsc', 'ifscCode'],                              profile.bankIfsc);
        this.setIfPropertyExists(component, ['bankName'],                                          profile.bankName);

        // Director details from EntityProfile
        this.setIfPropertyExists(component, ['directorName', 'dir1FullName', 'ownerName'],         profile.directorName);
        this.setIfPropertyExists(component, ['directorEmail', 'dir1Email', 'dir1Mail'],            profile.directorEmail);
        this.setIfPropertyExists(component, ['directorPhone', 'dir1Phone', 'dir1Mobile'],          profile.directorPhone);
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
        this.setIfPropertyExists(component, ['panNumber', 'pan', 'companyPan'], matchedEntity.pan);
        this.setIfPropertyExists(component, ['gst', 'gstNumber', 'gstin'], matchedEntity.gstin);
        this.setIfPropertyExists(component, ['address', 'companyAddress', 'businessAddress', 'officeAddress'], matchedEntity.address || matchedEntity.registeredAddress);
        this.setIfPropertyExists(component, ['tan', 'tanNumber'], matchedEntity.tan);
        this.setIfPropertyExists(component, ['cin', 'cinNumber'], matchedEntity.cin);
        this.setIfPropertyExists(component, ['iso', 'isoNumber'], matchedEntity.iso);
        this.setIfPropertyExists(component, ['msme', 'msmeNumber', 'udyamNumber'], matchedEntity.msme);
        this.setIfPropertyExists(component, ['lei', 'leiNumber'], matchedEntity.lei);
        this.setIfPropertyExists(component, ['iec', 'iecNumber'], matchedEntity.iec);
        this.setIfPropertyExists(component, ['fssai', 'fssaiNumber'], matchedEntity.fssai);
      }
    }

    // 2. Try to find the associated director details for personal info
    if (user.directors && user.directors.length > 0) {
      const mainDirector = user.directors[0];
      this.setIfPropertyExists(component, ['aadhaar', 'aadhaarNumber', 'ownerAadhaar'], mainDirector.aadhaar);
      if (!component.panNumber && !component.pan) {
         this.setIfPropertyExists(component, ['panNumber', 'pan', 'ownerPan'], mainDirector.pan);
      }
      this.setIfPropertyExists(component, ['mobile', 'mobileNumber', 'phone', 'contactNumber'], mainDirector.mobileNumber || mainDirector.phone);
      this.setIfPropertyExists(component, ['email', 'emailId', 'personalEmail'], mainDirector.email);
    }
  }

  private static setIfPropertyExists(component: any, possibleNames: string[], value: any) {
    if (!value) return;
    for (const name of possibleNames) {
      if (name in component) {
        // Only override if the field is empty to prevent erasing user input
        if (!component[name] || component[name] === '') {
          component[name] = value;
        }
        break; // Stop after first match in the component
      }
    }
  }
}
