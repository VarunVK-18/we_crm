import 'dart:convert';
void main() {
  String j = '{"pattern": "^[a-zA-Z\\\\\\\\s]+\$"}';
  Map<String, dynamic> d = jsonDecode(j);
  print(d['pattern']);
  print(RegExp(d['pattern']!).hasMatch('12'));
  print(RegExp(d['pattern']!).hasMatch('abc'));
}
