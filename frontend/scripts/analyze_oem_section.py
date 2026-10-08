import sys
import os
import zlib
import struct
import math

def paeth(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc: return a
    elif pb <= pc: return b
    else: return c

def decode_png(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    pos = 8
    width = height = None
    idat = []
    color_type = None
    while pos < len(data):
        length, ctype = struct.unpack('>I4s', data[pos:pos+8])
        pos += 8
        cdata = data[pos:pos+length]
        pos += length + 4
        if ctype == b'IHDR':
            width, height, depth, color_type = struct.unpack('>IIBB', cdata[:10])
            assert depth == 8
            assert color_type in (2, 6)
        elif ctype == b'IDAT':
            idat.append(cdata)
        elif ctype == b'IEND':
            break
            
    raw = zlib.decompress(b''.join(idat))
    bpp = 3 if color_type == 2 else 4
    stride = 1 + width * bpp
    pixels = []
    prior = [0] * (width * bpp)
    
    for y in range(height):
        ftype = raw[y * stride]
        row = list(raw[y * stride + 1 : (y + 1) * stride])
        unfiltered = [0] * len(row)
        for i in range(len(row)):
            a = unfiltered[i - bpp] if i >= bpp else 0
            b = prior[i]
            c = prior[i - bpp] if i >= bpp else 0
            if ftype == 0: val = row[i]
            elif ftype == 1: val = (row[i] + a) % 256
            elif ftype == 2: val = (row[i] + b) % 256
            elif ftype == 3: val = (row[i] + (a + b) // 2) % 256
            elif ftype == 4: val = (row[i] + paeth(a, b, c)) % 256
            unfiltered[i] = val
        prior = unfiltered
        
        row_rgba = []
        for x in range(width):
            if color_type == 2:
                r, g, b = unfiltered[x*3 : (x+1)*3]
                a = 255
            else:
                r, g, b, a = unfiltered[x*4 : (x+1)*4]
            row_rgba.append((r, g, b, a))
        pixels.append(row_rgba)
    return width, height, pixels

def write_png(filepath, width, height, pixels):
    raw_data = bytearray()
    for row in pixels:
        raw_data.append(0)
        for r, g, b, a in row:
            raw_data.extend([r, g, b, a])
    compressed = zlib.compress(bytes(raw_data), 9)
    def chunk(ctype, data):
        c = ctype + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    out = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    out.extend(chunk(b'IHDR', ihdr))
    out.extend(chunk(b'IDAT', compressed))
    out.extend(chunk(b'IEND', b''))
    with open(filepath, 'wb') as f:
        f.write(out)

def main():
    w, h, pixels = decode_png('docs/section_10_oem_clean.png')
    
    # Let's locate the center of the arc concentric circles:
    # Notice the central white dome has boundary with #e1eefb at y=977 on x=960.
    # Where does it cross on the left and right?
    # Let's find white pixels around the dome
    dome_edge_points = []
    for y in range(970, 1140, 5):
        # find where it transitions between #e1eefb and #ffffff on left and right
        left_edge = None
        right_edge = None
        for x in range(500, 960):
            r, g, b, a = pixels[y][x]
            # #e1eefb has r < 235, b > 245. #ffffff has r > 250, g > 250, b > 250
            if (r > 250 and g > 250 and b > 250) and left_edge is None:
                left_edge = x
                break
        for x in range(1420, 960, -1):
            r, g, b, a = pixels[y][x]
            if (r > 250 and g > 250 and b > 250) and right_edge is None:
                right_edge = x
                break
        if left_edge and right_edge:
            dome_edge_points.append(((left_edge, y), (right_edge, y)))
            
    print(f"Sampled {len(dome_edge_points)} dome edge pairs:")
    for left, right in dome_edge_points[:8]:
        mid = (left[0] + right[0]) / 2.0
        width = right[0] - left[0]
        print(f"  y={left[1]}: left={left[0]}, right={right[0]}, mid={mid:.1f}, width={width:.1f}")

    # Now let's find all the partner logo badges!
    # Partner logo badges are white circular discs resting on the light blue background!
    # (except Salesforce which is blue #00a1e0 / cloud on white circle or blue disc).
    # Inside the badges are non-white/non-blue ink pixels (logos).
    # Let's find all distinct clusters of ink (logos) across the image (excluding the title at y < 350 and Webkorps at y > 1050):
    visited = set()
    logo_clusters = []
    
    for y in range(320, 1050, 2):
        for x in range(200, 1720, 2):
            if (x, y) in visited:
                continue
            r, g, b, a = pixels[y][x]
            # Is this ink? (i.e. not the background colors #ffffff, #f2f8fe, #e8f2fb, #e1eefb)
            # Background colors all have r > 220, g > 230, b > 245
            is_bg = (r >= 220 and g >= 230 and b >= 245) or (r >= 250 and g >= 250 and b >= 250)
            if not is_bg:
                # Flood fill or bbox find
                cluster = []
                queue = [(x, y)]
                visited.add((x, y))
                min_cx, max_cx = x, x
                min_cy, max_cy = y, y
                while queue:
                    qx, qy = queue.pop(0)
                    cluster.append((qx, qy))
                    min_cx = min(min_cx, qx)
                    max_cx = max(max_cx, qx)
                    min_cy = min(min_cy, qy)
                    max_cy = max(max_cy, qy)
                    for dx, dy in [(-3, 0), (3, 0), (0, -3), (0, 3)]:
                        nx, ny = qx + dx, qy + dy
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                            nr, ng, nb, _ = pixels[ny][nx]
                            nis_bg = (nr >= 220 and ng >= 230 and nb >= 245) or (nr >= 250 and ng >= 250 and nb >= 250)
                            if not nis_bg:
                                visited.add((nx, ny))
                                queue.append((nx, ny))
                if len(cluster) > 30 and (max_cx - min_cx) > 10 and (max_cy - min_cy) > 10:
                    logo_clusters.append({
                        'bbox': (min_cx, min_cy, max_cx, max_cy),
                        'center': ((min_cx + max_cx) // 2, (min_cy + max_cy) // 2),
                        'size': (max_cx - min_cx + 1, max_cy - min_cy + 1),
                        'points': len(cluster)
                    })

    print(f"\nFound {len(logo_clusters)} candidate logo clusters:")
    # Merge overlapping/adjacent clusters
    merged = []
    for c in logo_clusters:
        bx0, by0, bx1, by1 = c['bbox']
        was_merged = False
        for m in merged:
            mx0, my0, mx1, my1 = m['bbox']
            # Check distance between centers or bbox overlap with padding
            dist = math.hypot(c['center'][0] - m['center'][0], c['center'][1] - m['center'][1])
            if dist < 120:
                m['bbox'] = (min(bx0, mx0), min(by0, my0), max(bx1, mx1), max(by1, my1))
                m['center'] = ((m['bbox'][0] + m['bbox'][2]) // 2, (m['bbox'][1] + m['bbox'][3]) // 2)
                m['size'] = (m['bbox'][2] - m['bbox'][0] + 1, m['bbox'][3] - m['bbox'][1] + 1)
                m['points'] += c['points']
                was_merged = True
                break
        if not was_merged:
            merged.append(c)

    print(f"After merging: {len(merged)} logo clusters:")
    for idx, m in enumerate(sorted(merged, key=lambda x: (x['center'][1], x['center'][0]))):
        print(f"  [{idx+1}] center={m['center']}, bbox={m['bbox']}, size={m['size']}")

if __name__ == '__main__':
    main()
