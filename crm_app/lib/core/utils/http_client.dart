import 'dart:convert';
import 'package:http/http.dart' as raw_http;
export 'package:http/http.dart' show MultipartFile, Response, StreamedResponse, Client, Request;

const timeoutDuration = Duration(seconds: 15);

Future<raw_http.Response> get(Uri url, {Map<String, String>? headers}) {
  return raw_http.get(url, headers: headers).timeout(timeoutDuration);
}

Future<raw_http.Response> post(Uri url, {Map<String, String>? headers, Object? body, Encoding? encoding}) {
  return raw_http.post(url, headers: headers, body: body, encoding: encoding).timeout(timeoutDuration);
}

Future<raw_http.Response> put(Uri url, {Map<String, String>? headers, Object? body, Encoding? encoding}) {
  return raw_http.put(url, headers: headers, body: body, encoding: encoding).timeout(timeoutDuration);
}

Future<raw_http.Response> delete(Uri url, {Map<String, String>? headers, Object? body, Encoding? encoding}) {
  return raw_http.delete(url, headers: headers, body: body, encoding: encoding).timeout(timeoutDuration);
}

Future<raw_http.Response> patch(Uri url, {Map<String, String>? headers, Object? body, Encoding? encoding}) {
  return raw_http.patch(url, headers: headers, body: body, encoding: encoding).timeout(timeoutDuration);
}

class MultipartRequest extends raw_http.MultipartRequest {
  MultipartRequest(super.method, super.url);

  @override
  Future<raw_http.StreamedResponse> send() {
    return super.send().timeout(timeoutDuration);
  }
}
