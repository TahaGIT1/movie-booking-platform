import os
from PIL import Image

os.makedirs('public/images/movies', exist_ok=True)
os.makedirs('public/images/events', exist_ok=True)
os.makedirs('public/images/streams', exist_ok=True)
os.makedirs('public/images/backgrounds', exist_ok=True)

# 1. Backdrops from the reference PDFs
home_img = Image.open('public/images/references/home_page_1.png')
events_img = Image.open('public/images/references/events_page_1.png')
streams_img = Image.open('public/images/references/streams_page_1.png')
login_img = Image.open('public/images/references/login_page_1.png')

# Save full hero backdrops
home_img.save('public/images/backgrounds/batman_hero.jpg', quality=92)
events_img.save('public/images/backgrounds/festival_hero.jpg', quality=92)
streams_img.save('public/images/backgrounds/dragon_hero.jpg', quality=92)
login_img.save('public/images/backgrounds/login_hero.jpg', quality=92)

# 2. Extract cards with precise coordinates
# Home cards (2134 x 1192)
w_h, h_h = home_img.size
# Card 1 (Batman): 954, 563 to 1243, 995
batman_card = home_img.crop((int(w_h * 0.449), int(h_h * 0.473), int(w_h * 0.582), int(h_h * 0.835)))
batman_card.save('public/images/movies/the-batman.jpg', quality=95)

# Card 2 (Dune): 1260 to 1555
dune_card = home_img.crop((int(w_h * 0.596), int(h_h * 0.473), int(w_h * 0.728), int(h_h * 0.835)))
dune_card.save('public/images/movies/dune.jpg', quality=95)

# Card 3 (Avatar): 1572 to 1867
avatar_card = home_img.crop((int(w_h * 0.741), int(h_h * 0.473), int(w_h * 0.874), int(h_h * 0.835)))
avatar_card.save('public/images/movies/avatar.jpg', quality=95)

# Card 4 (Inception): 1884 to 2130
inception_card = home_img.crop((int(w_h * 0.887), int(h_h * 0.473), int(w_h * 0.998), int(h_h * 0.835)))
inception_card.save('public/images/movies/inception.jpg', quality=95)

# Events cards (2211 x 1234)
w_e, h_e = events_img.size
music_card = events_img.crop((int(w_e * 0.449), int(h_e * 0.473), int(w_e * 0.582), int(h_e * 0.835)))
music_card.save('public/images/events/global-music-fest.jpg', quality=95)

comedy_card = events_img.crop((int(w_e * 0.596), int(h_e * 0.473), int(w_e * 0.728), int(h_e * 0.835)))
comedy_card.save('public/images/events/comedy-show.jpg', quality=95)

art_card = events_img.crop((int(w_e * 0.741), int(h_e * 0.473), int(w_e * 0.874), int(h_e * 0.835)))
art_card.save('public/images/events/art-exhibition.jpg', quality=95)

tech_card = events_img.crop((int(w_e * 0.887), int(h_e * 0.473), int(w_e * 0.998), int(h_e * 0.835)))
tech_card.save('public/images/events/tech-summit.jpg', quality=95)

# Streams cards (2211 x 1234)
w_s, h_s = streams_img.size
dragon_card = streams_img.crop((int(w_s * 0.449), int(h_s * 0.473), int(w_s * 0.582), int(h_s * 0.835)))
dragon_card.save('public/images/streams/house-of-the-dragon.jpg', quality=95)

tlou_card = streams_img.crop((int(w_s * 0.596), int(h_s * 0.473), int(w_s * 0.728), int(h_s * 0.835)))
tlou_card.save('public/images/streams/the-last-of-us.jpg', quality=95)

mando_card = streams_img.crop((int(w_s * 0.741), int(h_s * 0.473), int(w_s * 0.874), int(h_s * 0.835)))
mando_card.save('public/images/streams/the-mandalorian.jpg', quality=95)

stranger_card = streams_img.crop((int(w_s * 0.887), int(h_s * 0.473), int(w_s * 0.998), int(h_s * 0.835)))
stranger_card.save('public/images/streams/stranger-things.jpg', quality=95)

print("Successfully saved all cards and backdrops directly from reference PDFs!")
