import os
from PIL import Image
import numpy as np
from collections import deque

OUTPUT_DIR = r"c:\Cassavas\Game2.5D\artifacts\mmorpg-game\public\assets\characters"
BRAIN_DIR = r"C:\Users\admin\.gemini\antigravity\brain\3896eda5-b1dc-4dc7-a940-0eaf6f35f2c7"

def process_sprite(src_path, dest_filename, bg_threshold=22, enclosed_threshold=15, target_box_size=320):
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return False

    im = Image.open(src_path).convert("RGB")
    arr = np.array(im)
    h, w, _ = arr.shape

    # Background sample from corners
    corners = [arr[0, 0], arr[0, w-1], arr[h-1, 0], arr[h-1, w-1]]
    bg_sample = np.mean(corners, axis=0).astype(float)

    # Compute Euclidean or Manhattan distance to background
    diff = np.abs(arr.astype(float) - bg_sample)
    dist = np.max(diff, axis=-1)

    # Flood fill from borders to identify outer background
    is_outer_bg = dist < bg_threshold
    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()

    for x in range(w):
        if is_outer_bg[0, x]: q.append((0, x)); bg_mask[0, x] = True
        if is_outer_bg[h-1, x]: q.append((h-1, x)); bg_mask[h-1, x] = True
    for y in range(h):
        if is_outer_bg[y, 0]: q.append((y, 0)); bg_mask[y, 0] = True
        if is_outer_bg[y, w-1]: q.append((y, w-1)); bg_mask[y, w-1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not bg_mask[ny, nx] and is_outer_bg[ny, nx]:
                    bg_mask[ny, nx] = True
                    q.append((ny, nx))

    # Also clean enclosed background pockets that match pure background closely
    enclosed_bg = (dist < enclosed_threshold) & ~((arr[:, :, 0] < 50) & (arr[:, :, 1] < 50) & (arr[:, :, 2] < 50))
    final_bg = bg_mask | enclosed_bg

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = arr
    rgba[:, :, 3] = 255
    rgba[final_bg, 3] = 0

    out = Image.fromarray(rgba)
    bbox = out.getbbox()
    if not bbox:
        print(f"Error: Empty bounding box for {src_path}")
        return False
    cropped = out.crop(bbox)

    # Fit into 360x360 with padding
    target = Image.new("RGBA", (360, 360), (0, 0, 0, 0))
    cw, ch = cropped.size
    scale = min(target_box_size / ch, target_box_size / cw)
    nw, nh = int(cw * scale), int(ch * scale)
    resized = cropped.resize((nw, nh), resample=Image.NEAREST)

    px = (360 - nw) // 2
    py = (360 - nh) // 2 + 5
    target.paste(resized, (px, py), resized)

    out_path = os.path.join(OUTPUT_DIR, dest_filename)
    target.save(out_path)
    print(f"SUCCESS: {dest_filename} saved at: {out_path} ({os.path.getsize(out_path)} bytes)")
    return True

if __name__ == "__main__":
    male_gunner = os.path.join(BRAIN_DIR, "male_cyber_gunner_sprite_1792164386816.jpg")
    female_gunner = os.path.join(BRAIN_DIR, "female_cyber_gunner_pixel_art_1792164456253.jpg")
    female_assassin = os.path.join(BRAIN_DIR, "female_assassin_kunoichi_sprite_1792164523812.jpg")

    process_sprite(male_gunner, "gunner_male.png")
    process_sprite(female_gunner, "gunner_female.png")
    process_sprite(female_assassin, "assassin_female.png")
