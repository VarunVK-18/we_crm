import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def pad_image(input_path, output_path, padding_factor):
    img = Image.open(input_path).convert("RGBA")
    
    width, height = img.size
    
    # Calculate new dimensions
    new_width = int(width * padding_factor)
    new_height = int(height * padding_factor)
    
    # Sample the top-left pixel to use as the background color for padding
    bg_color = img.getpixel((0, 0))
    
    # Create new image with that background color
    new_img = Image.new('RGBA', (new_width, new_height), bg_color)
    
    # Paste original image in the center
    offset = ((new_width - width) // 2, (new_height - height) // 2)
    new_img.paste(img, offset, img)
    
    new_img.save(output_path)
    print(f"Padded image saved to {output_path} with background {bg_color}")

if __name__ == '__main__':
    pad_image('C:/projects/we_crm/crm_app/assets/launcher_icon.png', 'C:/projects/we_crm/crm_app/assets/launcher_icon_padded.png', 1.25)
