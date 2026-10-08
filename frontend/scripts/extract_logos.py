import zlib
import struct
import os

def read_png(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos = 8
    width = height = None
    idat_parts = []
    
    while pos < len(data):
        length, ctype = struct.unpack('>I4s', data[pos:pos+8])
        pos += 8
        cdata = data[pos:pos+length]
        pos += length + 4
        if ctype == b'IHDR':
            width, height, depth, color, comp, filt, inter = struct.unpack('>IIBBBBB', cdata)
        elif ctype == b'IDAT':
            idat_parts.append(cdata)
        elif ctype == b'IEND':
            break
            
    raw = zlib.decompress(b''.join(idat_parts))
    stride = 1 + width * 4
    pixels = []
    for y in range(height):
        row_filter = raw[y * stride]
        row_data = raw[y * stride + 1 : (y + 1) * stride]
        # assuming filter 0 for simplicity if sips generated it, but let's handle RGBA pixels
        row = []
        for x in range(width):
            r = row_data[x * 4]
            g = row_data[x * 4 + 1]
            b = row_data[x * 4 + 2]
            a = row_data[x * 4 + 3]
            row.append((r, g, b, a))
        pixels.append(row)
    return width, height, pixels

def write_png(filepath, width, height, pixels):
    raw_data = bytearray()
    for row in pixels:
        raw_data.append(0) # filter 0 (None)
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

def extract():
    os.makedirs('src/assets/brands', exist_ok=True)
    width, height, pixels = read_png('docs/logo-strip.png')
    
    # 7 logos horizontally
    # Let's inspect columns where there is ink vs empty white space
    ink_cols = []
    for x in range(width):
        col_has_ink = False
        for y in range(height):
            r, g, b, a = pixels[y][x]
            # Exclude right-hand Figma guideline (blue line around x >= 750)
            if x > 750:
                continue
            if (r < 235 or g < 235 or b < 235) and not (r < 100 and g < 150 and b > 200):
                col_has_ink = True
                break
        ink_cols.append(col_has_ink)
        
    # Group contiguous ink columns
    boxes = []
    in_box = False
    start = 0
    for x in range(len(ink_cols)):
        if ink_cols[x] and not in_box:
            in_box = True
            start = x
        elif not ink_cols[x] and in_box:
            in_box = False
            if x - start > 15: # minimum width for a logo
                boxes.append((start, x))
    if in_box:
        boxes.append((start, len(ink_cols)))
        
    print(f'Found {len(boxes)} logo clusters: {boxes}')
    
    names = [
        'verizon',
        'acima',
        'bhai-bandhu',
        'cryoport',
        'puravankara',
        'property-finder',
        'cloudshot'
    ]
    
    for i, (start_x, end_x) in enumerate(boxes[:7]):
        # Add 4px padding
        x0 = max(0, start_x - 3)
        x1 = min(width, end_x + 3)
        
        # Find vertical ink bounds
        y_has_ink = [False] * height
        for y in range(height):
            for x in range(x0, x1):
                r, g, b, a = pixels[y][x]
                if (r < 235 or g < 235 or b < 235) and not (r < 100 and g < 150 and b > 200):
                    y_has_ink[y] = True
                    break
        y_bounds = [y for y, has in enumerate(y_has_ink) if has]
        if not y_bounds:
            continue
        y0 = max(0, min(y_bounds) - 3)
        y1 = min(height, max(y_bounds) + 4)
        
        crop_w = x1 - x0
        crop_h = y1 - y0
        
        crop_pixels = []
        for y in range(y0, y1):
            row = []
            for x in range(x0, x1):
                r, g, b, a = pixels[y][x]
                # If near white or figma border blue, make transparent
                if (r > 240 and g > 240 and b > 240) or (r < 120 and g < 160 and b > 210):
                    row.append((0, 0, 0, 0))
                else:
                    # preserve gray logo text
                    row.append((r, g, b, 255))
            crop_pixels.append(row)
            
        filename = f'src/assets/brands/{names[i]}.png'
        write_png(filename, crop_w, crop_h, crop_pixels)
        print(f'Saved {filename} ({crop_w}x{crop_h})')

extract()
