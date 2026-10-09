from PIL import Image

# Let's inspect the cards positions in home_page_1.png (2134 x 1192)
im_home = Image.open("public/images/references/home_page_1.png")
w, h = im_home.size
print(f"Home image size: {w}x{h}")

# The 4 cards are located horizontally in the right half of the image.
# On 2134x1192:
# The cards typically occupy y from ~45% to ~85% (y: ~530 to ~1000)
# Let's calculate card positions:
# In home_page_1:
# Card 1 (The Batman): around x: 950 to 1250, y: 560 to 1000
# Card 2 (Dune): around x: 1260 to 1560
# Card 3 (Avatar): around x: 1570 to 1870
# Card 4 (Inception): around x: 1880 to 2134

# Let's write an automated helper to crop and test
card_w = int(w * 0.145) # ~310px
card_h = int(h * 0.36)  # ~430px
start_y = int(h * 0.47) # ~560px

# Let's crop sample regions to verify exact boundaries
crops = [
    ("batman_sample", int(w * 0.445), int(h * 0.47), int(w * 0.585), int(h * 0.84)),
    ("dune_sample", int(w * 0.59), int(h * 0.47), int(w * 0.73), int(h * 0.84)),
    ("avatar_sample", int(w * 0.735), int(h * 0.47), int(w * 0.875), int(h * 0.84)),
    ("inception_sample", int(w * 0.88), int(h * 0.47), int(w * 1.0), int(h * 0.84))
]

for name, x1, y1, x2, y2 in crops:
    cropped = im_home.crop((x1, y1, x2, y2))
    cropped.save(f"public/images/movies/{name}.png")
    print(f"Saved {name}: {cropped.size}")

# Also background for Batman hero:
# Top left to right, entire backdrop
bg_batman = im_home.crop((0, 0, w, h))
bg_batman.save("public/images/backgrounds/batman_hero.png")
print("Saved batman_hero.png")
