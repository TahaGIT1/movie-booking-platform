from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

im = Image.open('public/images/references/home_page_1.png')
w, h = im.size

# Let's crop Batman without text:
# x: 550 to 1020, y: 60 to 550
batman_head = im.crop((550, 60, 1050, 560))
batman_head.save('public/images/backgrounds/batman_clean_crop.png')

# Create a clean 1920x1080 canvas with dark gradient
clean_bg = Image.new('RGB', (1920, 1080), color=(10, 11, 14))

# Create atmospheric dark rain & red glow background
arr = np.zeros((1080, 1920, 3), dtype=np.uint8)
for y in range(1080):
    for x in range(1920):
        # subtle red glow near center-right
        dist_x = (x - 750) / 1920.0
        dist_y = (y - 300) / 1080.0
        rad = np.exp(-(dist_x**2 * 3 + dist_y**2 * 4))
        r = int(10 + rad * 45)
        g = int(11 + rad * 12)
        b = int(14 + rad * 15)
        arr[y, x] = [r, g, b]

ambient = Image.fromarray(arr).filter(ImageFilter.GaussianBlur(radius=30))

# Place Batman at x: 480, y: 40 with feathered edges
batman_resized = batman_head.resize((int(batman_head.width * 1.55), int(batman_head.height * 1.55)), Image.Resampling.LANCZOS)
bw, bh = batman_resized.size

# Create feather mask
mask = Image.new('L', (bw, bh), 255)
mask_arr = np.ones((bh, bw), dtype=np.float32)
for y in range(bh):
    for x in range(bw):
        edge_x = min(x, bw - x) / float(bw * 0.25)
        edge_y = min(y, bh - y) / float(bh * 0.25)
        edge = min(1.0, max(0.0, min(edge_x, edge_y)))
        mask_arr[y, x] = edge
mask = Image.fromarray((mask_arr * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=25))

ambient.paste(batman_resized, (480, 20), mask)
ambient.save('public/images/backgrounds/batman_hero.jpg', quality=95)
ambient.save('public/images/backgrounds/login_hero.jpg', quality=95)
print("Saved clean batman_hero.jpg!")
