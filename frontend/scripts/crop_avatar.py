import os
from PIL import Image

home_img = Image.open('public/images/references/home_page_1.png')
w, h = home_img.size

# Look at top right area:
# x: 1560 to 1640, y: 25 to 85
avatar = home_img.crop((int(w * 0.742), int(h * 0.024), int(w * 0.772), int(h * 0.075)))
os.makedirs('public/images/avatars', exist_ok=True)
avatar.save('public/images/avatars/marcus.jpg', quality=95)
print(f"Avatar cropped: {avatar.size}")
