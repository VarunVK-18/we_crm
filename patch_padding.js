const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/orders/order_tracker.dart', 'utf8');

c = c.replace(/contentPadding: const EdgeInsets\.symmetric\(\s*vertical: 12,\s*\),/, `contentPadding: const EdgeInsets.symmetric(
                            vertical: 12,
                            horizontal: 16,
                          ),`);

fs.writeFileSync('crm_app/lib/features/orders/order_tracker.dart', c);
