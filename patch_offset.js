const fs = require('fs');
let c = fs.readFileSync('crm_app/lib/features/orders/order_tracker.dart', 'utf8');

c = c.replace(/offset: const Offset\(-12, 0\)/g, 'offset: const Offset(0, 0)');

fs.writeFileSync('crm_app/lib/features/orders/order_tracker.dart', c);
