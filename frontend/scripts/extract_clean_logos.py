import zlib
import struct
import os

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
    while pos < len(data):
        length, ctype = struct.unpack('>I4s', data[pos:pos+8])
        pos += 8
        cdata = data[pos:pos+length]
        pos += length + 4
        if ctype == b'IHDR':
            width, height, depth, color = struct.unpack('>IIBB', cdata[:10])
            assert color == 6 and depth == 8
        elif ctype == b'IDAT':
            idat.append(cdata)
        elif ctype == b'IEND':
            break
    raw = zlib.decompress(b''.join(idat))
    bpp = 4
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
            r, g, b, a = unfiltered[x*4 : (x+1)*4]
            row_rgba.append((r, g, b, a))
        pixels.append(row_rgba)
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

def process_and_extract():
    os.makedirs('src/assets/brands', exist_ok=True)
    width, height, pixels = decode_png('docs/logo-strip.png')
    
    # Exclude right-hand edge guideline (Figma blue box outline at x >= 754)
    max_valid_x = 753
    
    # Detect logo columns
    has_ink = []
    for x in range(max_valid_x):
        col_ink = False
        for y in range(height):
            r, g, b, a = pixels[y][x]
            # Muted gray text is typically r, g, b around 120-180
            if r < 235 or g < 235 or b < 235:
                # exclude blue figma lines
                if not (r < 100 and g < 150 and b > 200):
                    col_ink = True
                    break
        has_ink.append(col_ink)
        
    # Exact logo boundaries from inspection
    clusters = [
        (15, 90),   # Verizon
        (130, 205), # Acima
        (248, 318), # Bhai Bandhu
        (350, 442), # Cryoport Systems
        (460, 560), # Puravankara
        (590, 656), # Property Finder
        (685, 752)  # Cloudshot
    ]
        
    print(f'Detected {len(clusters)} logo intervals:')
    for idx, (s, e) in enumerate(clusters):
        print(f'  {idx+1}: [{s}, {e}] (width {e-s}px)')
        
    brands = [
        ('verizon', 'Verizon'),
        ('acima', 'Acima'),
        ('bhai-bandhu', 'Bhai Bandhu'),
        ('cryoport', 'Cryoport Systems'),
        ('puravankara', 'Puravankara'),
        ('property-finder', 'Property Finder'),
        ('cloudshot', 'Cloudshot')
    ]
    
    # Create transparent version of each logo
    for i, (s, e) in enumerate(clusters[:7]):
        name, label = brands[i]
        x0 = max(0, s - 3)
        x1 = min(max_valid_x, e + 3)
        
        # Vertical bounding box
        y_has_ink = [False] * height
        for y in range(height):
            for x in range(x0, x1):
                r, g, b, a = pixels[y][x]
                if r < 238 or g < 238 or b < 238:
                    y_has_ink[y] = True
                    break
        y_indices = [y for y, has in enumerate(y_has_ink) if has]
        y0 = max(0, min(y_indices) - 3)
        y1 = min(height, max(y_indices) + 4)
        
        w_crop = x1 - x0
        h_crop = y1 - y0
        
        crop_rows = []
        for y in range(y0, y1):
            row = []
            for x in range(x0, x1):
                r, g, b, a = pixels[y][x]
                # Background removal with alpha gradient for clean antialiasing
                lum = (r * 299 + g * 587 + b * 114) // 1000
                if lum >= 248:
                    # pure white
                    row.append((0, 0, 0, 0))
                elif lum > 220:
                    # soft antialiasing
                    alpha = int(255 * (248 - lum) / (248 - 220))
                    row.append((r, g, b, alpha))
                else:
                    row.append((r, g, b, 255))
            crop_rows.append(row)
            
        out_path = f'src/assets/brands/{name}.png'
        write_png(out_path, w_crop, h_crop, crop_rows)
        print(f'Wrote {label} -> {out_path} ({w_crop}x{h_crop})')
        
    # Also write a complete full-width clean transparent strip
    strip_w = max_valid_x
    strip_h = height
    strip_rows = []
    for y in range(strip_h):
        row = []
        for x in range(strip_w):
            r, g, b, a = pixels[y][x]
            lum = (r * 299 + g * 587 + b * 114) // 1000
            if lum >= 248:
                row.append((0, 0, 0, 0))
            elif lum > 220:
                alpha = int(255 * (248 - lum) / (248 - 220))
                row.append((r, g, b, alpha))
            else:
                row.append((r, g, b, 255))
        strip_rows.append(row)
    write_png('src/assets/brands/leading-brands-strip.png', strip_w, strip_h, strip_rows)
    print('Wrote leading-brands-strip.png')

if __name__ == '__main__':
    process_and_extract()
