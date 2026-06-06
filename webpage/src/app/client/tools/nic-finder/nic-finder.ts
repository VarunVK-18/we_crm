import { Component, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NicCode {
  code: string;
  description: string;
  type: string;
}

@Component({
  selector: 'app-nic-finder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nic-finder.html',
  styleUrl: './nic-finder.css',
})
export class NicFinder {
  searchQuery = signal('');

  allNicCodes: NicCode[] = [
    {code: '6201', description: 'Computer programming activities', type: 'Class'},
    {code: '62011', description: 'Writing, modifying, testing of computer program to meet the needs of a particular client excluding web-page designing', type: 'Sub-class'},
    {code: '62012', description: 'Web-page designing', type: 'Sub-class'},
    {code: '62013', description: 'Providing software support and maintenance to the clients', type: 'Sub-class'},
    {code: '6202', description: 'Computer consultancy and computer facilities management activities', type: 'Class'},
    {code: '62020', description: 'Computer consultancy and computer facilities management activities', type: 'Sub-class'},
    {code: '6209', description: 'Other information technology and computer service activities', type: 'Class'},
    {code: '62091', description: 'Software installation', type: 'Sub-class'},
    {code: '62092', description: 'Computer disaster recovery', type: 'Sub-class'},
    {code: '62099', description: 'Other information technology and computer service activities n.e.c', type: 'Sub-class'},
    {code: '6311', description: 'Data processing, hosting and related activities', type: 'Class'},
    {code: '63111', description: 'Data processing activities', type: 'Sub-class'},
    {code: '63112', description: 'Web hosting activities', type: 'Sub-class'},
    {code: '6312', description: 'Web portals', type: 'Class'},
    {code: '63121', description: 'Operation of web sites that use a search engine to generate and maintain extensive databases', type: 'Sub-class'},
    {code: '63122', description: 'Operation of other websites that act as portals to the Internet', type: 'Sub-class'},
    {code: '6920', description: 'Accounting, bookkeeping and auditing activities; tax consultancy', type: 'Class'},
    {code: '69201', description: 'Accounting, bookkeeping and auditing activities', type: 'Sub-class'},
    {code: '69202', description: 'Tax consultancy', type: 'Sub-class'},
    {code: '7020', description: 'Management consultancy activities', type: 'Class'},
    {code: '70200', description: 'Management consultancy activities', type: 'Sub-class'},
    {code: '7310', description: 'Advertising', type: 'Class'},
    {code: '73100', description: 'Advertising', type: 'Sub-class'},
    {code: '4711', description: 'Retail sale in non-specialized stores with food, beverages or tobacco predominating', type: 'Class'},
    {code: '47110', description: 'Retail sale in non-specialized stores with food, beverages or tobacco predominating', type: 'Sub-class'},
    {code: '4791', description: 'Retail sale via mail order houses or via Internet', type: 'Class'},
    {code: '47911', description: 'Retail sale via mail order houses', type: 'Sub-class'},
    {code: '47912', description: 'Retail sale via Internet', type: 'Sub-class'},
    {code: '5610', description: 'Restaurants and mobile food service activities', type: 'Class'},
    {code: '56101', description: 'Restaurants without bars', type: 'Sub-class'},
    {code: '56102', description: 'Cafeterias, fast-food restaurants and other food preparation in market stalls', type: 'Sub-class'},
    {code: '5621', description: 'Event catering', type: 'Class'},
    {code: '56210', description: 'Event catering', type: 'Sub-class'},
    {code: '8510', description: 'Primary education', type: 'Class'},
    {code: '85101', description: 'Pre-primary education (kindergarten and nurseries)', type: 'Sub-class'},
    {code: '85102', description: 'Primary education', type: 'Sub-class'},
    {code: '8521', description: 'General secondary education', type: 'Class'},
    {code: '85211', description: 'General school education in the first stage of the secondary level', type: 'Sub-class'},
    {code: '85212', description: 'General school education in the second stage of the secondary level (Senior secondary)', type: 'Sub-class'},
    {code: '8620', description: 'Medical and dental practice activities', type: 'Class'},
    {code: '86201', description: 'Medical practice activities', type: 'Sub-class'},
    {code: '86202', description: 'Dental practice activities', type: 'Sub-class'},
    {code: '9602', description: 'Hairdressing and other beauty treatment', type: 'Class'},
    {code: '96020', description: 'Hairdressing and other beauty treatment', type: 'Sub-class'},
    {code: '9609', description: 'Other personal service activities n.e.c.', type: 'Class'},
    {code: '96098', description: 'Pet care services', type: 'Sub-class'}
  ];

  filteredCodes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.allNicCodes;
    }
    return this.allNicCodes.filter(c => 
      c.code.toLowerCase().includes(query) || 
      c.description.toLowerCase().includes(query)
    );
  });

  constructor(public location: Location) {}

  goBack() {
    this.location.back();
  }
}
