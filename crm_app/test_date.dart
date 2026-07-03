import 'package:intl/intl.dart';

void main() {
  final dt = DateTime.parse('2024-07-03T10:00:00Z');
  print('isUtc: ${dt.isUtc}');
  print('Formatted: ${DateFormat('yyMMddHHmm').format(dt)}');
  print('Formatted local: ${DateFormat('yyMMddHHmm').format(dt.toLocal())}');
}
