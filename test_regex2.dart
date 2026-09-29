import 'dart:convert';
void main() {
  String j = '{"pattern": "^[a-zA-Z\\\\\\\\s]+\$"}';
  Map<String, dynamic> d = jsonDecode(j);
  try {
    print(RegExp(d['pattern']!).hasMatch('12'));
  } catch (e) {
    print('ERROR OCCURRED: $e');
  }
}
