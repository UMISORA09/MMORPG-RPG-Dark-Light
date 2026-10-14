import os
from PIL import Image, ImageDraw
import numpy as np
from collections import deque

USER_UPLOADED_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\1bd2268e-1f7a-41b1-92c5-11d70d7e1ae7\.user_uploaded"
TARGET_DIR = r"c:\Cassavas\Game2.5D\artifacts\mmorpg-game\public\assets\characters"
os.makedirs(TARGET_DIR, exist_ok=True)

def process_female_warrior():
    # Use media_1791993363845.png or media_1791993265585.png
    src_path = os.path.join(USER_UPLOADED_DIR, "media_1791993363845.png")
    if not os.path.exists(src_path):
        src_path = os.path.join(USER_UPLOADED_DIR, "media_1791993265585.png")
    
    im = Image.open(src_path).convert("RGB")
    arr = np.array(im)
    h, w, _ = arr.shape

    bg_sample = arr[0, 0].astype(int)
    diff = np.abs(arr.astype(int) - bg_sample)
    dist = np.max(diff, axis=-1)

    # Grey background condition
    is_bg = dist < 14

    # Flood fill from boundary
    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_bg[0, x]: q.append((0, x)); bg_mask[0, x] = True
        if is_bg[h-1, x]: q.append((h-1, x)); bg_mask[h-1, x] = True
    for y in range(h):
        if is_bg[y, 0]: q.append((y, 0)); bg_mask[y, 0] = True
        if is_bg[y, w-1]: q.append((y, w-1)); bg_mask[y, w-1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not bg_mask[ny, nx] and is_bg[ny, nx]:
                    bg_mask[ny, nx] = True
                    q.append((ny, nx))

    # Also clean internal enclosed background regions
    enclosed_bg = (dist < 10)
    final_bg = bg_mask | enclosed_bg

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = arr
    rgba[:, :, 3] = 255
    rgba[final_bg, 3] = 0

    out = Image.fromarray(rgba)
    bbox = out.getbbox()
    cropped = out.crop(bbox)

    # Fit into 360x360 with padding
    target = Image.new("RGBA", (360, 360), (0, 0, 0, 0))
    cw, ch = cropped.size
    scale = min(320 / ch, 320 / cw)
    nw, nh = int(cw * scale), int(ch * scale)
    resized = cropped.resize((nw, nh), resample=Image.NEAREST)

    px = (360 - nw) // 2
    py = (360 - nh) // 2 + 5
    target.paste(resized, (px, py), resized)

    out_path = os.path.join(TARGET_DIR, "fighter_female.png")
    target.save(out_path)
    print("SUCCESS: fighter_female.png saved at:", out_path)

def process_male_warrior():
    src_path = os.path.join(USER_UPLOADED_DIR, "media_1791993280322.png")
    im = Image.open(src_path).convert("RGB")
    arr = np.array(im)
    h, w, _ = arr.shape

    bg_sample = arr[0, 0].astype(int)
    diff = np.abs(arr.astype(int) - bg_sample)
    dist = np.max(diff, axis=-1)

    # Blue background
    is_bg = dist < 18

    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_bg[0, x]: q.append((0, x)); bg_mask[0, x] = True
    for y in range(h):
        if is_bg[y, 0]: q.append((y, 0)); bg_mask[y, 0] = True
        if is_bg[y, w-1]: q.append((y, w-1)); bg_mask[y, w-1] = True

    # Do not flood fill below y = 576 to separate from reflection
    while q:
        y, x = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny <= 576 and 0 <= nx < w:
                if not bg_mask[ny, nx] and is_bg[ny, nx]:
                    bg_mask[ny, nx] = True
                    q.append((ny, nx))

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = arr
    rgba[:, :, 3] = 255

    # Erase everything below soles y > 576 (reflection)
    rgba[577:, :, 3] = 0
    # Erase blue background
    rgba[bg_mask, 3] = 0
    # Also clean internal enclosed blue spots
    internal_blue = (dist < 14) & (np.arange(h)[:, None] <= 576)
    rgba[internal_blue, 3] = 0

    out = Image.fromarray(rgba)
    bbox = out.getbbox()
    cropped = out.crop(bbox)

    # Fit into 360x360 with padding
    target = Image.new("RGBA", (360, 360), (0, 0, 0, 0))
    cw, ch = cropped.size
    scale = min(320 / ch, 320 / cw)
    nw, nh = int(cw * scale), int(ch * scale)
    resized = cropped.resize((nw, nh), resample=Image.NEAREST)

    px = (360 - nw) // 2
    py = (360 - nh) // 2 + 5
    target.paste(resized, (px, py), resized)

    out_path = os.path.join(TARGET_DIR, "fighter_male.png")
    target.save(out_path)
    print("SUCCESS: fighter_male.png saved at:", out_path)

def cleanup_old_files():
    old_files = [
        os.path.join(TARGET_DIR, "fighter_male.svg"),
        os.path.join(TARGET_DIR, "fighter_female.svg"),
        os.path.join(TARGET_DIR, "test_feet.png"),
    ]
    for p in old_files:
        if os.path.exists(p):
            os.remove(p)
            print("Removed old file:", p)

if __name__ == "__main__":
    process_female_warrior()
    process_male_warrior()
    cleanup_old_files()
    print("ALL WARRIOR ASSETS ACTIVATED CLEANLY!")
