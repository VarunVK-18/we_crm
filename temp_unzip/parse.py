import json

input_file = "c:/projects/we_crm/temp_unzip/2a57f25e6f814aa9a5187991ceb37385.json"
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

for page in data.get("pages", [])[:8]: # check up to page 8 to see some actual data
    items = page.get("content", [])
    
    # Sort items by Y first
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
        
    print(f"--- Page {page['page_id']} ---")
    for line in lines:
        line.sort(key=lambda item: item[0]) # sort by X
        line_text = " | ".join([f"X:{int(x)} {text}" for x, text in line])
        print(line_text)
