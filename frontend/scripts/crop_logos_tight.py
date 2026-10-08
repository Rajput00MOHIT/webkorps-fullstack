import sys
import os
import glob
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from scripts.analyze_oem_section import decode_png, write_png

def crop_tight():
    for f in sorted(glob.glob('src/assets/oem/logo_*.png')):
        if 'webkorps' in f:
            continue
        w, h, pixels = decode_png(f)
        
        # Find ink pixels (not white and not transparent)
        xs, ys = [], []
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[y][x]
                if a > 20 and not (r > 245 and g > 245 and b > 245):
                    xs.append(x)
                    ys.append(y)
                    
        if not xs or not ys:
            print(f"Warning: No ink found in {f}")
            continue
            
        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)
        
        pad = 6
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
                r, g, b, a = pixels[y][x]
                # If near white, make transparent
                if r > 240 and g > 240 and b > 240:
                    row.append((0, 0, 0, 0))
                else:
                    row.append((r, g, b, a))
            crop_pixels.append(row)
            
        write_png(f, crop_w, crop_h, crop_pixels)
        print(f"Cropped {os.path.basename(f)} to {crop_w}x{crop_h} (ink was {max_x-min_x+1}x{max_y-min_y+1})")

if __name__ == '__main__':
    crop_tight()
