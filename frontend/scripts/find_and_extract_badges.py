import sys
import os
import math
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from scripts.analyze_oem_section import decode_png, write_png

def main():
    w, h, pixels = decode_png('docs/section_10_oem_clean.png')
    
    # Center of concentric orbits
    cx, cy = 960, 1357
    print(f"Orbit center: ({cx}, {cy})")
    
    # We know the 9 partners from visual inspection:
    # 1. Salesforce (top-most, around x=896, y=360-440)
    # 2. AWS (upper-left, around x=614, y=470-540)
    # 3. Fortinet (upper-right, around x=1080, y=500-600)
    # 4. Trellix (left, around x=511, y=700-780)
    # 5. Sysdig (inner-left, around x=703, y=760-840)
    # 6. Adobe (inner-right, around x=1144, y=740-820)
    # 7. CloudSEK (right, around x=1492, y=640-700)
    # 8. Cisco (lower-left, around x=370, y=870-980)
    # 9. HPE Juniper (lower-right, around x=1531, y=940-1040)
    # 10. Webkorps center logo at (960, 1070)
    
    # Let's locate the circular white badge for each of these!
    # A circular white badge has pixels with (r > 250, g > 250, b > 250) on an arc with blue background.
    
    # Let's search around candidate areas:
    candidates = [
        ('salesforce', 896, 400, 48), # Salesforce is a blue cloud on a white circular badge or blue badge
        ('aws', 614, 500, 60),
        ('fortinet', 1080, 560, 60),
        ('trellix', 511, 740, 60),
        ('sysdig', 703, 800, 60),
        ('adobe', 1144, 780, 60),
        ('cloudsek', 1492, 660, 60),
        ('cisco', 370, 930, 60),
        ('hpe_juniper', 1531, 980, 60),
        ('webkorps', 960, 1080, 120),
    ]
    
    os.makedirs('src/assets/oem', exist_ok=True)
    
    for name, approx_x, approx_y, search_r in candidates:
        # Find all white or non-blue-bg pixels in [approx_x - 120, approx_x + 120] x [approx_y - 120, approx_y + 120]
        # Let's find the bounding box of the badge
        print(f"\n--- Investigating {name} near ({approx_x}, {approx_y}) ---")
        
        # Check what the badge looks like:
        # Most badges are white circles. Let's find the circle center and radius.
        badge_pixels = []
        for y in range(max(0, approx_y - 120), min(h, approx_y + 120)):
            for x in range(max(0, approx_x - 120), min(w, approx_x + 120)):
                r, g, b, a = pixels[y][x]
                # Is this part of the badge?
                # For Salesforce, badge could be blue or white.
                # For others, badge is white or logo ink. Background is blue: r < 245, b > 248
                # Background colors:
                # #F2F8FE: (242, 248, 254)
                # #E8F2FB: (232, 242, 251)
                # #E1EEFB: (225, 238, 251)
                is_bg = (215 <= r <= 246 and 230 <= g <= 250 and 245 <= b <= 255)
                if not is_bg:
                    badge_pixels.append((x, y, r, g, b))
                    
        if badge_pixels:
            min_bx = min(p[0] for p in badge_pixels)
            max_bx = max(p[0] for p in badge_pixels)
            min_by = min(p[1] for p in badge_pixels)
            max_by = max(p[1] for p in badge_pixels)
            badge_cx = (min_bx + max_bx) // 2
            badge_cy = (min_by + max_by) // 2
            badge_w = max_bx - min_bx + 1
            badge_h = max_by - min_by + 1
            
            # Orbit radius from (cx, cy)
            orbit_r = math.hypot(badge_cx - cx, badge_cy - cy)
            # Orbit angle in degrees (0 is horizontal right, 90 is top, 180 is left)
            # In standard math: angle = atan2(-(y - cy), x - cx)
            angle_rad = math.atan2(-(badge_cy - cy), badge_cx - cx)
            angle_deg = math.degrees(angle_rad)
            
            print(f"  Detected badge: center=({badge_cx}, {badge_cy}), size=({badge_w}x{badge_h})")
            print(f"  Orbit radius: {orbit_r:.1f}px, Orbit angle: {angle_deg:.1f}°")
            
            # Let's crop and extract a clean badge
            # Make a square crop centered at (badge_cx, badge_cy)
            crop_radius = max(badge_w, badge_h) // 2 + 6
            crop_size = crop_radius * 2
            x0 = badge_cx - crop_radius
            y0 = badge_cy - crop_radius
            
            crop_pixels = []
            for y in range(y0, y0 + crop_size):
                row = []
                for x in range(x0, x0 + crop_size):
                    if 0 <= x < w and 0 <= y < h:
                        r, g, b, a = pixels[y][x]
                        # Check distance from badge center
                        d = math.hypot(x - badge_cx, y - badge_cy)
                        if d > crop_radius - 2:
                            # Outside the circle -> transparent
                            row.append((0, 0, 0, 0))
                        else:
                            # If it's a white badge, keep the circle clean
                            # If pixel is background blue outside the inner badge, make transparent
                            is_bg = (215 <= r <= 246 and 230 <= g <= 250 and 245 <= b <= 255)
                            if is_bg:
                                row.append((0, 0, 0, 0))
                            else:
                                row.append((r, g, b, 255))
                    else:
                        row.append((0, 0, 0, 0))
                crop_pixels.append(row)
                
            out_path = f'src/assets/oem/{name}.png'
            write_png(out_path, crop_size, crop_size, crop_pixels)
            print(f"  Saved badge to {out_path} ({crop_size}x{crop_size})")

if __name__ == '__main__':
    main()
