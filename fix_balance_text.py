import sys

file_path = "crm_app/lib/features/orders/service_order_detail_screen.dart"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """Text('You have remaining balance of ₹${(order.dealClosedAmount - order.advanceAmountPaid).toStringAsFixed(0)} and pay to unlock', style: const TextStyle(fontSize: 13, color: Color(0xFF92400E))),"""

replacement = """RichText(
                                          text: TextSpan(
                                            style: const TextStyle(fontSize: 13, color: Color(0xFF92400E), fontFamily: 'Inter'),
                                            children: [
                                              const TextSpan(text: 'You have a remaining balance of '),
                                              TextSpan(
                                                text: '₹${(order.dealClosedAmount - order.advanceAmountPaid).toStringAsFixed(0)}',
                                                style: const TextStyle(fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                        ),"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated service_order_detail_screen.dart successfully")
else:
    print("Could not find the target text")
