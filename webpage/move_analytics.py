import sys

with open('src/app/dashboard/home-overview/home-overview.html', 'r') as f:
    lines = f.readlines()

# Financial Analytics is from line 93 to 211 (0-indexed 92 to 211)
fin_analytics = lines[92:211]

# Ongoing tasks is from line 297 to 351 (0-indexed 296 to 351)
# But we need to verify indices. Let's search by string.
fin_start = -1
fin_end = -1
tasks_start = -1
tasks_end = -1

for i, line in enumerate(lines):
    if '<!-- Financial Analytics Section (Admin Only) -->' in line:
        fin_start = i
    if '<!-- Performance Overview Section -->' in line:
        fin_end = i - 1
    if '<!-- Main Content: Recent Filings -->' in line:
        tasks_start = i
    if '<!-- Sidebar: Recent Activity & Reminders -->' in line:
        tasks_end = i - 1

if fin_start != -1 and fin_end != -1 and tasks_start != -1 and tasks_end != -1:
    fin_content = lines[fin_start:fin_end]
    
    # We will replace tasks with fin_content
    # And replace fin_content with nothing
    
    # Remove fin_content
    new_lines = lines[:fin_start] + lines[fin_end:tasks_start] + fin_content + lines[tasks_end:]
    
    with open('src/app/dashboard/home-overview/home-overview.html', 'w') as f:
        f.writelines(new_lines)
    print("Successfully moved Financial Analytics and removed Tasks.")
else:
    print(f"Error finding bounds: fin_start={fin_start}, fin_end={fin_end}, tasks_start={tasks_start}, tasks_end={tasks_end}")
