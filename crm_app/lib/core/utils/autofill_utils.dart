import '../../models/user_model.dart';
import 'package:flutter/material.dart';

class AutofillUtils {
  static void autoFillTextData(
    UserModel user, 
    String orderEntityName, 
    Map<String, TextEditingController> controllers,
  ) {
    String entityName = orderEntityName.trim();
    if (entityName.isEmpty) {
      entityName = user.companyName;
    }
    
    // Normalize entity name for fuzzy matching
    String normalizedName = entityName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    
    ClientEntity? matchedEntity;
    if (user.clientEntities.isNotEmpty) {
      if (normalizedName.isNotEmpty) {
        try {
          matchedEntity = user.clientEntities.firstWhere(
            (e) => e.entityName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '') == normalizedName
          );
        } catch (e) {
          // not found exactly
          try {
            matchedEntity = user.clientEntities.firstWhere(
              (e) => e.entityName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '').contains(normalizedName) || 
                     normalizedName.contains(e.entityName.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), ''))
            );
          } catch (e) {
            matchedEntity = user.clientEntities.first;
          }
        }
      } else {
        matchedEntity = user.clientEntities.first;
      }
    }

    void setIfPropertyExists(List<String> possibleNames, dynamic value) {
      if (value == null || value.toString().isEmpty) return;
      String strValue = value.toString();
      
      for (String name in possibleNames) {
        String normalizedAlias = name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
        
        for (var entry in controllers.entries) {
          String compKey = entry.key;
          TextEditingController controller = entry.value;
          
          String normalizedCompKey = compKey.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
          if (normalizedCompKey == normalizedAlias || normalizedCompKey.endsWith(normalizedAlias)) {
            if (controller.text.isEmpty) {
              controller.text = strValue;
            }
            return;
          }
        }
      }
    }

    // Map fields
    if (matchedEntity != null) {
      setIfPropertyExists(['companyName', 'companyLegalName', 'legalName', 'businessName', 'nameOfTheCompany', 'entityName', 'tradeName'], matchedEntity.entityName);
      setIfPropertyExists(['panOfBusiness', 'companyPan', 'panNumber', 'pan'], matchedEntity.pan);
      setIfPropertyExists(['gst', 'gstNumber', 'gstin'], matchedEntity.gstin);
      setIfPropertyExists(['address', 'companyAddress', 'businessAddress', 'officeAddress'], user.email); // Just using user data if entity lacks address for now
      setIfPropertyExists(['tan', 'tanNumber'], matchedEntity.tan);
      setIfPropertyExists(['cin', 'cinNumber'], matchedEntity.cin);
      setIfPropertyExists(['iso', 'isoNumber'], matchedEntity.iso);
      setIfPropertyExists(['iec', 'iecCode', 'iecNumber'], ''); // Add if available
      String incorp = matchedEntity.incorporationDate != null 
          ? "${matchedEntity.incorporationDate!.day.toString().padLeft(2, '0')}/${matchedEntity.incorporationDate!.month.toString().padLeft(2, '0')}/${matchedEntity.incorporationDate!.year}"
          : '';
      setIfPropertyExists(['incorporationDate', 'incorpDate', 'dateOfIncorporation'], incorp);
      setIfPropertyExists(['msme', 'msmeNumber', 'udyamNumber'], matchedEntity.msme);
      setIfPropertyExists(['fssai', 'fssaiNumber'], matchedEntity.fssai);
    } else {
      setIfPropertyExists(['companyName', 'companyLegalName', 'legalName', 'businessName', 'nameOfTheCompany', 'entityName', 'tradeName'], entityName);
    }

    if (user.directors.isNotEmpty) {
      var mainDirector = user.directors.first;
      setIfPropertyExists(['aadhaar', 'aadhaarNumber', 'ownerAadhaar'], mainDirector['aadhaar']);
      setIfPropertyExists(['directorName', 'dir1FullName', 'ownerName', 'contactPerson', 'applicantName', 'signatoryName'], mainDirector['ownerName'] ?? mainDirector['directorName']);
      setIfPropertyExists(['panOfBusiness', 'ownerPan', 'panNumber', 'pan'], mainDirector['pan']);
      setIfPropertyExists(['mobile', 'mobileNumber', 'phone', 'contactNumber', 'whatsapp', 'businessPhone', 'signatoryMobile', 'dir1Phone'], mainDirector['mobileNumber'] ?? mainDirector['phone']);
      setIfPropertyExists(['email', 'emailId', 'personalEmail', 'businessEmail', 'companyEmail', 'signatoryEmail', 'dir1Mail'], mainDirector['email']);
      setIfPropertyExists(['directorDin', 'dir1Din'], mainDirector['din']);
      setIfPropertyExists(['directorPan', 'dir1Pan'], mainDirector['pan']);
    }

    setIfPropertyExists(['directorName', 'dir1FullName', 'ownerName', 'contactPerson', 'applicantName', 'signatoryName'], user.name);
    setIfPropertyExists(['email', 'emailId', 'personalEmail', 'businessEmail', 'companyEmail', 'signatoryEmail', 'dir1Mail'], user.email);
    setIfPropertyExists(['mobile', 'mobileNumber', 'phone', 'contactNumber', 'whatsapp', 'businessPhone', 'signatoryMobile', 'dir1Phone'], user.phone);
  }
}
