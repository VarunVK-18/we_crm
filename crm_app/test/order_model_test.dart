import 'package:flutter_test/flutter_test.dart';
import 'package:crm_app/models/order_model.dart';

void main() {
  group('ServiceOrder parsing', () {
    test('should parse ServiceOrder correctly from a valid map', () {
      final jsonMap = {
        '_id': 'order_123',
        'serviceType': 'GST Registration',
        'status': 'active',
        'stage': 'workInProgress',
        'createdAt': '2026-09-23T10:00:00Z',
        'assignedExpert': 'John Doe',
        'steps': [
          { 'title': 'Documents Verified', 'isCompleted': true, 'isActionStep': false }
        ],
        'details': { 'panNumber': 'ABCDE1234F' }
      };

      final order = ServiceOrder.fromMap(jsonMap, 'order_123');

      expect(order.id, 'order_123');
      expect(order.serviceType, 'GST Registration');
      expect(order.status, ServiceStatus.active);
      expect(order.stage, OrderStage.workInProgress);
      expect(order.assignedExpert, 'John Doe');
      expect(order.steps.length, 1);
      expect(order.steps.first.title, 'Documents Verified');
      expect(order.steps.first.isCompleted, true);
      expect(order.details['panNumber'], 'ABCDE1234F');
    });

    test('should handle missing fields gracefully', () {
      final jsonMap = {
        '_id': 'order_456',
        'serviceType': 'MSME Registration'
      };

      final order = ServiceOrder.fromMap(jsonMap, 'order_456');

      expect(order.id, 'order_456');
      expect(order.serviceType, 'MSME Registration');
      expect(order.status, ServiceStatus.notInitialized);
      expect(order.steps.isEmpty, true);
      expect(order.requestedDocuments.isEmpty, true);
    });
  });
}
