import json
import re
import sys
import os

def parse_nic(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    result = {"NIC_2008": {"sections": []}}
    
    curr_section = None
    curr_division = None
    curr_group = None
    curr_class = None
    curr_subclass = None
    
    last_entity_type = None
    
    for page in data.get("pages", []):
        items = page.get("content", [])
        items.sort(key=lambda item: item['position'][1])
        
        lines = []
        current_line = []
        current_y = None
        
        for item in items:
            y = item['position'][1]
            x = item['position'][0]
            text = item['text']
            
            if current_y is None:
                current_y = y
                current_line.append((x, text))
            elif abs(y - current_y) < 5.0:
                current_line.append((x, text))
            else:
                lines.append(current_line)
                current_line = [(x, text)]
                current_y = y
                
        if current_line:
            lines.append(current_line)
            
        for line in lines:
            line.sort(key=lambda item: item[0])
            
            if len(line) == 1 and re.match(r'^\d+$', line[0][1].strip()):
                continue
            if len(line) >= 1 and "Group" in line[0][1]:
                continue
            if len(line) == 1 and "Detailed Structure" in line[0][1]:
                continue
            if len(line) >= 1 and "class" == line[0][1].strip().lower():
                continue
                
            text = " ".join([t[1] for t in line])
            
            sec_match = re.match(r'SECTION\s+([A-Z])\s*:\s*(.*)', text, re.I)
            if sec_match:
                curr_section = {
                    "section": sec_match.group(1),
                    "title": sec_match.group(2).strip(),
                    "divisions": []
                }
                result["NIC_2008"]["sections"].append(curr_section)
                curr_division = None
                curr_group = None
                curr_class = None
                curr_subclass = None
                last_entity_type = 'section'
                continue
                
            div_match = re.match(r'Division\s+(\d{2})\s*:\s*(.*)', text, re.I)
            if div_match:
                curr_division = {
                    "division": div_match.group(1),
                    "title": div_match.group(2).strip(),
                    "groups": []
                }
                if curr_section:
                    curr_section["divisions"].append(curr_division)
                curr_group = None
                curr_class = None
                curr_subclass = None
                last_entity_type = 'division'
                continue
                
            code = None
            desc = []
            
            if len(line) > 1:
                first_x, first_text = line[0]
                if first_x < 210 and re.match(r'^\d{3,5}$', first_text.strip()):
                    code = first_text.strip()
                    desc = [t[1] for t in line[1:]]
            elif len(line) == 1:
                first_x, first_text = line[0]
                if first_x < 210 and re.match(r'^\d{3,5}$', first_text.strip()):
                    code = first_text.strip()
            
            if code:
                desc_str = " ".join(desc).strip()
                if len(code) == 3:
                    curr_group = {
                        "code": code,
                        "description": desc_str,
                        "classes": []
                    }
                    if curr_division:
                        curr_division["groups"].append(curr_group)
                    curr_class = None
                    curr_subclass = None
                    last_entity_type = 'group'
                elif len(code) == 4:
                    curr_class = {
                        "code": code,
                        "description": desc_str,
                        "sub_classes": []
                    }
                    if curr_group:
                        curr_group["classes"].append(curr_class)
                    curr_subclass = None
                    last_entity_type = 'class'
                elif len(code) == 5:
                    curr_subclass = {
                        "code": code,
                        "description": desc_str
                    }
                    if curr_class:
                        curr_class["sub_classes"].append(curr_subclass)
                    last_entity_type = 'subclass'
            else:
                desc_str = " ".join([t[1] for t in line]).strip()
                if desc_str:
                    if last_entity_type == 'section' and curr_section:
                        curr_section['title'] += " " + desc_str
                    elif last_entity_type == 'division' and curr_division:
                        curr_division['title'] += " " + desc_str
                    elif last_entity_type == 'group' and curr_group:
                        curr_group['description'] += " " + desc_str
                    elif last_entity_type == 'class' and curr_class:
                        curr_class['description'] += " " + desc_str
                    elif last_entity_type == 'subclass' and curr_subclass:
                        curr_subclass['description'] += " " + desc_str

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

parse_nic("c:/projects/we_crm/temp_unzip/2a57f25e6f814aa9a5187991ceb37385.json", "c:/projects/we_crm/scratch/new_nic_codes.json")
print("Done!")
