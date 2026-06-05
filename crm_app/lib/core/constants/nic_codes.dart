import 'package:flutter/material.dart';

class NicCode {
  final String code;
  final String description;
  final String type;

  const NicCode({
    required this.code,
    required this.description,
    required this.type,
  });
}

const List<NicCode> allNicCodes = [
  NicCode(code: '6201', description: 'Computer programming activities', type: 'Class'),
  NicCode(code: '62011', description: 'Writing, modifying, testing of computer program to meet the needs of a particular client excluding web-page designing', type: 'Sub-class'),
  NicCode(code: '62012', description: 'Web-page designing', type: 'Sub-class'),
  NicCode(code: '62013', description: 'Providing software support and maintenance to the clients', type: 'Sub-class'),
  NicCode(code: '6202', description: 'Computer consultancy and computer facilities management activities', type: 'Class'),
  NicCode(code: '62020', description: 'Computer consultancy and computer facilities management activities', type: 'Sub-class'),
  NicCode(code: '6209', description: 'Other information technology and computer service activities', type: 'Class'),
  NicCode(code: '62091', description: 'Software installation', type: 'Sub-class'),
  NicCode(code: '62092', description: 'Computer disaster recovery', type: 'Sub-class'),
  NicCode(code: '62099', description: 'Other information technology and computer service activities n.e.c', type: 'Sub-class'),
  NicCode(code: '6311', description: 'Data processing, hosting and related activities', type: 'Class'),
  NicCode(code: '63111', description: 'Data processing activities', type: 'Sub-class'),
  NicCode(code: '63112', description: 'Web hosting activities', type: 'Sub-class'),
  NicCode(code: '6312', description: 'Web portals', type: 'Class'),
  NicCode(code: '63121', description: 'Operation of web sites that use a search engine to generate and maintain extensive databases', type: 'Sub-class'),
  NicCode(code: '63122', description: 'Operation of other websites that act as portals to the Internet', type: 'Sub-class'),
  NicCode(code: '6920', description: 'Accounting, bookkeeping and auditing activities; tax consultancy', type: 'Class'),
  NicCode(code: '69201', description: 'Accounting, bookkeeping and auditing activities', type: 'Sub-class'),
  NicCode(code: '69202', description: 'Tax consultancy', type: 'Sub-class'),
  NicCode(code: '7020', description: 'Management consultancy activities', type: 'Class'),
  NicCode(code: '70200', description: 'Management consultancy activities', type: 'Sub-class'),
  NicCode(code: '7310', description: 'Advertising', type: 'Class'),
  NicCode(code: '73100', description: 'Advertising', type: 'Sub-class'),
  NicCode(code: '4711', description: 'Retail sale in non-specialized stores with food, beverages or tobacco predominating', type: 'Class'),
  NicCode(code: '47110', description: 'Retail sale in non-specialized stores with food, beverages or tobacco predominating', type: 'Sub-class'),
  NicCode(code: '4791', description: 'Retail sale via mail order houses or via Internet', type: 'Class'),
  NicCode(code: '47911', description: 'Retail sale via mail order houses', type: 'Sub-class'),
  NicCode(code: '47912', description: 'Retail sale via Internet', type: 'Sub-class'),
  NicCode(code: '5610', description: 'Restaurants and mobile food service activities', type: 'Class'),
  NicCode(code: '56101', description: 'Restaurants without bars', type: 'Sub-class'),
  NicCode(code: '56102', description: 'Cafeterias, fast-food restaurants and other food preparation in market stalls', type: 'Sub-class'),
  NicCode(code: '5621', description: 'Event catering', type: 'Class'),
  NicCode(code: '56210', description: 'Event catering', type: 'Sub-class'),
  NicCode(code: '8510', description: 'Primary education', type: 'Class'),
  NicCode(code: '85101', description: 'Pre-primary education (kindergarten and nurseries)', type: 'Sub-class'),
  NicCode(code: '85102', description: 'Primary education', type: 'Sub-class'),
  NicCode(code: '8521', description: 'General secondary education', type: 'Class'),
  NicCode(code: '85211', description: 'General school education in the first stage of the secondary level', type: 'Sub-class'),
  NicCode(code: '85212', description: 'General school education in the second stage of the secondary level (Senior secondary)', type: 'Sub-class'),
  NicCode(code: '8620', description: 'Medical and dental practice activities', type: 'Class'),
  NicCode(code: '86201', description: 'Medical practice activities', type: 'Sub-class'),
  NicCode(code: '86202', description: 'Dental practice activities', type: 'Sub-class'),
  NicCode(code: '9602', description: 'Hairdressing and other beauty treatment', type: 'Class'),
  NicCode(code: '96020', description: 'Hairdressing and other beauty treatment', type: 'Sub-class'),
  NicCode(code: '9609', description: 'Other personal service activities n.e.c.', type: 'Class'),
  NicCode(code: '96098', description: 'Pet care services', type: 'Sub-class'),
  // We can add thousands more here using a JSON loader in the future.
];
