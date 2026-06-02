import 'package:flutter/material.dart';

class DirectorFormData {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController fatherNameController = TextEditingController();
  final TextEditingController dobController = TextEditingController();
  final TextEditingController placeOfBirthController = TextEditingController();
  String nationality = 'Indian';
  final TextEditingController occupationController = TextEditingController(text: 'Business');
  final TextEditingController educationController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController panController = TextEditingController();
  final TextEditingController aadhaarController = TextEditingController();
  final TextEditingController dinController = TextEditingController();
  String needDsc = 'Yes';
  String role = 'Director & Shareholder'; // Or 'Designated Partner', 'Partner' for LLP
  final TextEditingController shareholdingController = TextEditingController(); // For Private Limited
  final TextEditingController fixedCapitalController = TextEditingController(); // For LLP
  final TextEditingController profitSharingController = TextEditingController(); // For LLP
  String isAuthSignatory = 'Yes';

  // File paths for uploaded documents
  String? photoPath;
  String? signaturePath;
  String? addressProofPath;
  String? aadhaarPath;
  String? panPath;

  void dispose() {
    fullNameController.dispose();
    fatherNameController.dispose();
    dobController.dispose();
    placeOfBirthController.dispose();
    occupationController.dispose();
    educationController.dispose();
    emailController.dispose();
    phoneController.dispose();
    addressController.dispose();
    panController.dispose();
    aadhaarController.dispose();
    dinController.dispose();
    shareholdingController.dispose();
    fixedCapitalController.dispose();
    profitSharingController.dispose();
  }
  
  Map<String, dynamic> toJson() {
    return {
      'fullName': fullNameController.text,
      'fatherName': fatherNameController.text,
      'dob': dobController.text,
      'placeOfBirth': placeOfBirthController.text,
      'nationality': nationality,
      'occupation': occupationController.text,
      'education': educationController.text,
      'email': emailController.text,
      'phone': phoneController.text,
      'address': addressController.text,
      'pan': panController.text,
      'aadhaar': aadhaarController.text,
      'din': dinController.text,
      'needDsc': needDsc,
      'role': role,
      'shareholding': shareholdingController.text,
      'fixedCapital': fixedCapitalController.text,
      'profitSharing': profitSharingController.text,
      'isAuthSignatory': isAuthSignatory,
      'photoPath': photoPath,
      'signaturePath': signaturePath,
      'addressProofPath': addressProofPath,
      'aadhaarPath': aadhaarPath,
      'panPath': panPath,
    };
  }
}

