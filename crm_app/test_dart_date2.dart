import 'package:intl/intl.dart';
void main() {
  final dt = DateTime.tryParse('2026-06-29T04:55:14.482Z');
  print('dt: $dt');
  print('dt isUtc: ${dt?.isUtc}');
  print('Format: ${DateFormat('yyMMddHHmm').format(dt!)}');
}
