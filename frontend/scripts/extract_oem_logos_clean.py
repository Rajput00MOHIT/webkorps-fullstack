import sys
import os
import math
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from scripts.analyze_oem_section import decode_png, write_png

def main():
    w, h, pixels = decode_png('docs/section_10_oem_clean.png')
    
    # 1. First let's find the exact ink bounding boxes of each of the 9 logos
    # Approximate ink centers from the design:
    partners = [
        ('salesforce', 895, 434, 50),
        ('aws', 614, 523, 60),
        ('fortinet', 1108, 560, 60),
        ('trellix', 511, 757, 50),
        ('sysdig', 703, 799, 50),
        ('adobe', 1144, 783, 50),
        ('cloudsek', 1492, 672, 60),
        ('cisco', 374, 955, 60),
        ('hpe_juniper', 1531, 995, 60),
        ('webkorps', 960, 1085, 120),
    ]
    
    os.makedirs('src/assets/oem', exist_ok=True)
    
    print("Measuring logo ink and badge circles...")
    
    for name, cx_approx, cy_approx, box_radius in partners:
        # Find all ink pixels in this region
        ink_pixels = []
        for y in range(cy_approx - box_radius, cy_approx + box_radius):
            for x in range(cx_approx - box_radius, cx_approx + box_radius):
                if 0 <= x < w and 0 <= y < h:
                    r, g, b, a = pixels[y][x]
                    # If not near white (badge bg) and not light blue (canvas bg)
                    # Canvas bg: (220-250, 230-250, 245-255)
                    # White: (r > 245, g > 245, b > 245)
                    is_white = (r > 240 and g > 240 and b > 240)
                    is_bg_blue = (210 <= r <= 245 and 225 <= g <= 250 and 245 <= b <= 255)
                    if not is_white and not is_bg_blue:
                        ink_pixels.append((x, y, r, g, b))
                        
        if not ink_pixels:
            print(f"Warning: No ink found for {name} near ({cx_approx}, {cy_approx})")
            continue
            
        min_x = min(p[0] for p in ink_pixels)
        max_x = max(p[0] for p in ink_pixels)
        min_y = min(p[1] for p in ink_pixels)
        max_y = max(p[1] for p in ink_pixels)
        ink_cx = (min_x + max_x) // 2
        ink_cy = (min_y + max_y) // 2
        ink_w = max_x - min_x + 1
        ink_h = max_y - min_y + 1
        
        # Now let's find the white badge circle around this ink:
        # Check horizontal extent of pure white pixels (r > 250, g > 250, b > 250) across y = ink_cy
        left_white = ink_cx
        while left_white > 0:
            r, g, b, _ = pixels[ink_cy][left_white - 1]
            if r > 248 and g > 248 and b > 248:
                left_white -= 1
            else:
                break
        right_white = ink_cx
        while right_white < w - 1:
            r, g, b, _ = pixels[ink_cy][right_white + 1]
            if r > 248 and g > 248 and b > 248:
                right_white += 1
            else:
                break
        badge_diameter = right_white - left_white
        badge_center_x = (left_white + right_white) // 2
        
        # Check vertical extent
        top_white = ink_cy
        while top_white > 0:
            r, g, b, _ = pixels[top_white - 1][ink_cx]
            if r > 248 and g > 248 and b > 248:
                top_white -= 1
            else:
                break
        bot_white = ink_cy
        while bot_white < h - 1:
            r, g, b, _ = pixels[bot_white + 1][ink_cx]
            if r > 248 and g > 248 and b > 248:
                bot_white += 1
            else:
                break
        badge_v_diam = bot_white - top_white
        badge_center_y = (top_white + bot_white) // 2
        
        orbit_center_x, orbit_center_y = 960, 1357
        dist_to_orbit_center = math.hypot(badge_center_x - orbit_center_x, badge_center_y - orbit_center_y)
        angle_deg = math.degrees(math.atan2(-(badge_center_y - orbit_center_y), badge_center_x - orbit_center_x))
        
        print(f"[{name.upper()}]:")
        print(f"  Ink bbox: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}], size={ink_w}x{ink_h}")
        print(f"  Badge center: ({badge_center_x}, {badge_center_y}), diameter: {badge_diameter}x{badge_v_diam}")
        print(f"  Orbit radius: {dist_to_orbit_center:.1f}px, Orbit angle: {angle_deg:.1f}°")
        
        # Crop the ink with 4px margin and transparent background!
        pad = 4
        crop_w = ink_w + pad * 2
        crop_h = ink_h + pad * 2
        crop_pixels = []
        for y in range(min_y - pad, max_y + pad + 1):
            row = []
            for x in range(min_x - pad, max_x + pad + 1):
                if 0 <= x < w and 0 <= y < h:
                    r, g, b, a = pixels[y][x]
                    # If this is ink, keep it
                    is_white = (r > 242 and g > 242 and b > 242)
                    is_bg_blue = (210 <= r <= 245 and 225 <= g <= 250 and 245 <= b <= 255)
                    if not is_white and not is_bg_blue:
                        row.append((r, g, b, 255))
                    else:
                        row.append((0, 0, 0, 0))
                else:
                    row.append((0, 0, 0, 0))
            crop_pixels.append(row)
            
        out_logo_path = f'src/assets/oem/logo_{name}.png'
        write_png(out_logo_path, crop_w, crop_h, crop_pixels)
        print(f"  -> Saved clean logo to {out_logo_path} ({crop_w}x{crop_h})")

if __name__ == '__main__':
    main()
