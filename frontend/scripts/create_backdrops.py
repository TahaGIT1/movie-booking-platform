import os
from PIL import Image, ImageFilter, ImageEnhance

# Create tailored backgrounds for items 2, 3, 4 by blending extracted cards with deep dark atmospheric glows
def make_backdrop(card_path, out_path, tint_rgb=(10, 11, 14)):
    if not os.path.exists(card_path):
        return
    img = Image.open(card_path).convert('RGB')
    # Resize and heavily blur for deep cinematic ambient backdrop
    bg = img.resize((1920, 1080), Image.Resampling.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=60))
    # Darken
    enhancer = ImageEnhance.Brightness(bg)
    bg = enhancer.enhance(0.4)
    # Paste a sharper version centered right
    sharp_img = img.resize((700, 1050), Image.Resampling.LANCZOS)
    sharp_img = ImageEnhance.Brightness(sharp_img).enhance(0.65)
    bg.paste(sharp_img, (1100, 20))
    # Re-apply subtle blur overlay on edges
    bg.save(out_path, quality=90)
    print(f"Created backdrop {out_path}")

backdrops = [
    ('public/images/movies/dune.jpg', 'public/images/backgrounds/dune_hero.jpg'),
    ('public/images/movies/avatar.jpg', 'public/images/backgrounds/avatar_hero.jpg'),
    ('public/images/movies/inception.jpg', 'public/images/backgrounds/inception_hero.jpg'),
    ('public/images/events/comedy-show.jpg', 'public/images/backgrounds/comedy_hero.jpg'),
    ('public/images/events/art-exhibition.jpg', 'public/images/backgrounds/art_hero.jpg'),
    ('public/images/events/tech-summit.jpg', 'public/images/backgrounds/tech_hero.jpg'),
    ('public/images/streams/the-last-of-us.jpg', 'public/images/backgrounds/tlou_hero.jpg'),
    ('public/images/streams/the-mandalorian.jpg', 'public/images/backgrounds/mando_hero.jpg'),
    ('public/images/streams/stranger-things.jpg', 'public/images/backgrounds/stranger_hero.jpg'),
]

for src, dst in backdrops:
    make_backdrop(src, dst)
print("All backdrop variations created successfully!")
