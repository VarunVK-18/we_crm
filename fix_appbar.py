import sys

file_path = "crm_app/lib/features/services/registration_services_screen.dart"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add title to SliverAppBar
target_appbar = """          SliverAppBar(
            expandedHeight: 250.r,
            pinned: true,"""
replacement_appbar = """          SliverAppBar(
            expandedHeight: 250.r,
            pinned: true,
            title: Text(
              'Registration Hub',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 18.sp,
                fontWeight: FontWeight.w700,
              ),
            ),
            titleSpacing: 0,"""

if target_appbar in content:
    content = content.replace(target_appbar, replacement_appbar)
else:
    print("Could not find SliverAppBar target")

# 2. Reduce the length of the search bar
target_padding = "padding: EdgeInsets.fromLTRB(24.r, 24.r, 24.r, 16.r),"
replacement_padding = "padding: EdgeInsets.fromLTRB(48.r, 24.r, 48.r, 16.r),"

if target_padding in content:
    content = content.replace(target_padding, replacement_padding)
else:
    print("Could not find search bar padding target")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated registration_services_screen.dart")
