import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../core/constants/port.dart';
import '../models/banner_model.dart';
import 'auth_provider.dart';

final bannerProvider = FutureProvider<List<BannerModel>>((ref) async {
  final authState = ref.watch(authStateProvider).value;
  if (authState == null) return [];

  final uid = authState.uid;
  try {
    final response = await http.get(
      Uri.parse('$kBaseUrl/api/banners?all=false'),
      headers: {'x-user-id': uid},
    );
    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['banners'] != null) {
        final List<dynamic> data = jsonResponse['banners'];
        return data.map((json) => BannerModel.fromJson(json)).toList();
      }
    }
    return [];
  } catch (e) {
    print('Error fetching banners: $e');
    return [];
  }
});
