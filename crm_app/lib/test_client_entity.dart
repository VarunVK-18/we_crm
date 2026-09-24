import 'dart:convert';
import 'package:crm_app/models/user_model.dart';

void main() {
  print('--- Running Flutter ClientEntity Test ---');
  
  try {
    // Mock Payload replicating the API Response with the new fields included
    final Map<String, dynamic> mockApiData = {
      'entityName': 'Test Corp Pvt Ltd',
      'entityType': 'Company',
      'cin': 'U123456789',
      'pan': 'ABCDE1234F',
      'company_type': 'Private Limited',
      'authorised_capital': '1000000',
      'paidup_capital': '500000',
      'bank_details': {
        'bankName': 'HDFC Bank',
        'accountNumber': '000111222333',
        'ifscCode': 'HDFC0001234',
        'accountType': 'Current'
      }
    };

    // Attempt to Parse
    final entity = ClientEntity.fromMap(mockApiData);
    
    // Validations
    bool allPassed = true;
    
    void assertEqual(String testName, dynamic actual, dynamic expected) {
      if (actual == expected) {
        print('✅ [PASS] $testName');
      } else {
        print('❌ [FAIL] $testName | Expected: $expected, Got: $actual');
        allPassed = false;
      }
    }

    assertEqual('Parse Company Type', entity.companyType, 'Private Limited');
    assertEqual('Parse Authorised Capital', entity.authorisedCapital, '1000000');
    assertEqual('Parse Paidup Capital', entity.paidupCapital, '500000');
    
    if (entity.bankDetails != null) {
      assertEqual('Parse Bank Name', entity.bankDetails!['bankName'], 'HDFC Bank');
      assertEqual('Parse Account Number', entity.bankDetails!['accountNumber'], '000111222333');
    } else {
      print('❌ [FAIL] Bank Details Object is null!');
      allPassed = false;
    }
    
    if (allPassed) {
      print('\\n✅ All Flutter Parsing Tests Passed Successfully!');
    }
    
  } catch (e, stackTrace) {
    print('❌ [FAIL] Exception thrown during parsing!');
    print(e.toString());
    print(stackTrace);
  }
}
