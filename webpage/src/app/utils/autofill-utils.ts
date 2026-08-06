import { DocumentMatcher } from './document-matcher';

export class AutoFillUtils {
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
    // For now, if directors exist, we'll just take the first director (or owner) to populate personal details
    if (user.directors && user.directors.length > 0) {
      const mainDirector = user.directors[0];
      this.setIfPropertyExists(component, ['aadhaar', 'aadhaarNumber', 'ownerAadhaar'], mainDirector.aadhaar);
      if (!component.panNumber && !component.pan) {
         this.setIfPropertyExists(component, ['panNumber', 'pan', 'ownerPan'], mainDirector.pan); // fallback to director pan if entity pan is missing
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
