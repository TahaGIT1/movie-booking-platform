from PIL import Image, ImageFilter
import numpy as np

# Clean festival backdrop
im_ev = Image.open('public/images/references/events_page_1.png')
# The fireworks and crowd stage in events_page_1 is between y: 150 to 650, x: 500 to 1800
stage = im_ev.crop((550, 100, 1850, 650))
stage_resized = stage.resize((1920, 750), Image.Resampling.LANCZOS)

clean_ev = Image.new('RGB', (1920, 1080), color=(10, 11, 14))
clean_ev.paste(stage_resized, (0, 0))

# Darken bottom to blend into dark UI
mask_ev = Image.new('L', (1920, 1080), 255)
arr_ev = np.ones((1080, 1920), dtype=np.float32)
for y in range(1080):
    if y > 400:
        arr_ev[y, :] = max(0.0, 1.0 - (y - 400) / 450.0)
mask_ev = Image.fromarray((arr_ev * 255).astype(np.uint8))
clean_ev = Image.composite(clean_ev, Image.new('RGB', (1920, 1080), (10, 11, 14)), mask_ev)
clean_ev.save('public/images/backgrounds/festival_hero.jpg', quality=95)

# Clean dragon backdrop
im_st = Image.open('public/images/references/streams_page_1.png')
# The dragon head and rider in streams_page_1 is between y: 60 to 520, x: 500 to 1700
dragon = im_st.crop((520, 60, 1800, 520))
dragon_resized = dragon.resize((1920, 750), Image.Resampling.LANCZOS)
clean_st = Image.new('RGB', (1920, 1080), color=(10, 11, 14))
clean_st.paste(dragon_resized, (0, 0))
clean_st = Image.composite(clean_st, Image.new('RGB', (1920, 1080), (10, 11, 14)), mask_ev)
clean_st.save('public/images/backgrounds/dragon_hero.jpg', quality=95)

print("Saved clean festival_hero.jpg and dragon_hero.jpg!")
