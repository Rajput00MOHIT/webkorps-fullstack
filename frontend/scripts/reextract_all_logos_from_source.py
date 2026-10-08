import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from scripts.analyze_oem_section import decode_png, write_png

def extract_all():
    print("Decoding docs/section_10_oem_clean.png...")
    w, h, pixels = decode_png('docs/section_10_oem_clean.png')
    
    # Exact ink bounding boxes in the master clean art:
    # 1. Salesforce: x=[857, 935], y=[406, 461] (blue cloud)
    # 2. AWS: x=[574, 654], y=[499, 547] (aws + smile)
    # 3. Fortinet: x=[1020, 1159], y=[572, 609] (FORTINET.)
    # 4. Trellix: x=[485, 541], y=[750, 764] (Trellix)
    # 5. Sysdig: x=[661, 740], y=[782, 811] (sysdig)
    # 6. Adobe: x=[1094, 1174], y=[773, 794] (Adobe)
    # 7. CloudSEK: x=[1447, 1538], y=[660, 684] (CloudSEK)
    # 8. Cisco: x=[340, 409], y=[958, 994] (Cisco)
    # 9. HPE Juniper: x=[1487, 1574], y=[986, 1004] (HPE Juniper)
    # 10. Webkorps: x=[857, 1067], y=[1061, 1106] (Webkorps)
    
    boxes = [
        ('salesforce', 857, 406, 935, 461),
        ('aws', 574, 499, 654, 547),
        ('fortinet', 1020, 572, 1159, 609),
        ('trellix', 485, 750, 541, 764),
        ('sysdig', 661, 782, 740, 811),
        ('adobe', 1094, 773, 1174, 794),
        ('cloudsek', 1447, 660, 1538, 684),
        ('cisco', 340, 958, 409, 994),
        ('hpe_juniper', 1487, 986, 1574, 1004),
        ('webkorps', 857, 1061, 1067, 1106),
    ]
    
    os.makedirs('src/assets/oem', exist_ok=True)
    
    pad = 6
    for name, min_x, min_y, max_x, max_y in boxes:
        x0 = max(0, min_x - pad)
        x1 = min(w, max_x + pad + 1)
        y0 = max(0, min_y - pad)
        y1 = min(h, max_y + pad + 1)
        crop_w = x1 - x0
        crop_h = y1 - y0
        
        crop_pixels = []
        for y in range(y0, y1):
            row = []
            for x in range(x0, x1):
                r, g, b, _ = pixels[y][x]
                # If white or light canvas background, make transparent
                is_white = (r > 240 and g > 240 and b > 240)
                is_canvas_bg = (210 <= r <= 245 and 225 <= g <= 250 and 245 <= b <= 255)
                if not is_white and not is_canvas_bg:
                    row.append((r, g, b, 255))
                else:
                    row.append((0, 0, 0, 0))
            crop_pixels.append(row)
            
        out_f = f'src/assets/oem/logo_{name}.png'
        write_png(out_f, crop_w, crop_h, crop_pixels)
        print(f"Extracted {name:12s} -> {out_f} ({crop_w}x{crop_h})")

if __name__ == '__main__':
    extract_all()
