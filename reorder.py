import re
import sys

file_path = "crm_app/lib/features/services/registration_services_screen.dart"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We only want to reorder Tax and Licensing.
# IP is already: Trademark, Copyright, Patent.
# Tax should be: GST Registration, GST Returns Filing, Income Tax Return (ITR), GST Cancellation
# Licensing: DPIIT, ISO, FSSAI, IE Code, DUNS Number, LEI Registration, BIS Certification, CE Certification, RoHS Certification, Digital Signature Certificate (DSC)

# Using regex to extract the block
start_marker = "    // --- Tax ---"
end_marker = "  ];\n\n  List<Map<String, dynamic>> get _filteredPackages"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

tax_and_licensing = content[start_idx:end_idx]

# We can split the blocks by "    },\n"
# Actually, since it's just dart maps, we can extract them using regex.
items_raw = re.findall(r"(    \{\n.*?    \},?\n)", tax_and_licensing, flags=re.DOTALL)

# There should be 4 tax items and 10 licensing items.
items_dict = {}
for item in items_raw:
    title_match = re.search(r"'title': '(.*?)',", item)
    if title_match:
        title = title_match.group(1)
        items_dict[title] = item.strip(",\n") + ",\n"

tax_order = [
    "GST Registration",
    "GST Returns Filing",
    "Income Tax Return (ITR)",
    "GST Cancellation"
]

licensing_order = [
    "DPIIT Recognition",
    "ISO Certification",
    "FSSAI Registration",
    "IE Code",
    "DUNS Number",
    "LEI Registration",
    "BIS Certification",
    "CE Certification",
    "RoHS Certification",
    "Digital Signature Certificate (DSC)"
]

new_block = "    // --- Tax ---\n"
for t in tax_order:
    if t in items_dict:
        new_block += items_dict[t] + "\n"

new_block += "    // --- Licensing ---\n"
for l in licensing_order:
    if l in items_dict:
        new_block += items_dict[l] + "\n"

# Remove the trailing comma from the last item
new_block = new_block.rstrip(",\n") + "\n"

new_content = content[:start_idx] + new_block + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Reordered successfully!")
