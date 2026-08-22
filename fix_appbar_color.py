import sys

file_path = "crm_app/lib/features/orders/order_tracker.dart"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """      appBar: AppBar(
        title: Text(
          'My Services',
          style: GoogleFonts.inter(
            color: const Color(0xFF1E293B),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        actions: [
          Container(
            width: 140,
            height: 36,
            margin: const EdgeInsets.only(right: 8),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: const TextStyle(fontSize: 12, color: AppTheme.deepTeal),
              decoration: InputDecoration(
                hintText: 'Search',
                hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
                prefixIcon: const Icon(LucideIcons.search, size: 14, color: Colors.grey),
                filled: true,
                fillColor: Colors.grey.shade50,"""

replacement = """      appBar: AppBar(
        title: Text(
          'My Services',
          style: GoogleFonts.inter(
            color: const Color(0xFF1E293B),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: const Color(0xFFF4F6F9),
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        actions: [
          Container(
            width: 140,
            height: 36,
            margin: const EdgeInsets.only(right: 8),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: const TextStyle(fontSize: 12, color: AppTheme.deepTeal),
              decoration: InputDecoration(
                hintText: 'Search',
                hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
                prefixIcon: const Icon(LucideIcons.search, size: 14, color: Colors.grey),
                filled: true,
                fillColor: Colors.white,"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated AppBar color in order_tracker.dart successfully")
else:
    print("Could not find the target text")
