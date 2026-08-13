import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:crm_app/features/orders/gst_form_screen.dart';
import 'package:crm_app/models/order_model.dart';
import 'package:crm_app/core/theme/app_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUpAll(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('GstFormScreen loads successfully', (WidgetTester tester) async {
    final mockOrder = ServiceOrder(
      id: 'ord_gst_123',
      clientUid: 'cli_123',
      entityName: 'Test Entity',
      serviceType: 'GST Registration',
      companyName: 'Test Company',
      status: ServiceStatus.notInitialized,
      stage: OrderStage.quotePending,
      steps: [],
      requestedDocuments: [],
      finalDocuments: [],
      assignedExpert: 'Unassigned',
      expertPhone: '',
      createdAt: DateTime.now(),
    );

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: GstFormScreen(order: mockOrder),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Complete Details'), findsWidgets);
    expect(find.text('Business Information'), findsOneWidget);
    expect(find.text('Director 1 Personal Information'), findsOneWidget);
    expect(find.text('Submit Application'), findsOneWidget);
  });
}
