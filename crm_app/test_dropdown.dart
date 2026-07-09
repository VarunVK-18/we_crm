import 'package:flutter/material.dart';

void main() {
  final List<String> list = ['A', 'B'];
  final items = list.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList();
  print(items.runtimeType);
}
