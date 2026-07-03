import 'package:intl/intl.dart';

void main() {
  final dt = DateTime.parse('2024-07-03T10:00:00.000Z');
  print('Original: ${dt.toIso8601String()}, isUtc: ${dt.isUtc}');
  print('Format UTC: ${DateFormat('yyMMddHHmm').format(dt)}');
  print('Format Local: ${DateFormat('yyMMddHHmm').format(dt.toLocal())}');
}
