import 'dart:convert';
import 'dart:io';

void main() async {
  var request = await HttpClient().getUrl(Uri.parse('http://127.0.0.1:5001/api/forms/service/Company%20Profile'));
  var response = await request.close();
  var body = await response.transform(utf8.decoder).join();
  var data = jsonDecode(body);
  var city = data['fields'].firstWhere((f) => f['name'] == 'contactDetails')['subFields'].firstWhere((f) => f['name'] == 'city');
  print(city['validation']['pattern']);
  try {
    print(RegExp(city['validation']['pattern']).hasMatch('12'));
  } catch (e) {
    print('Error: $e');
  }
}
