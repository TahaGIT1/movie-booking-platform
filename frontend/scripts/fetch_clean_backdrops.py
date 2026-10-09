import urllib.request
import os

os.makedirs('public/images/backgrounds', exist_ok=True)
os.makedirs('public/images/movies', exist_ok=True)
os.makedirs('public/images/events', exist_ok=True)
os.makedirs('public/images/streams', exist_ok=True)

# Clean, stunning, official 4K/1080p backdrop URLs without any baked-in UI text
clean_assets = {
    # Backdrops
    'public/images/backgrounds/batman_hero.jpg': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1920&auto=format&fit=crop&q=85', # dark cinematic
    # Or official Batman red/black aesthetic:
    'public/images/backgrounds/batman_hero.jpg': 'https://images.wallpapersden.com/image/download/the-batman-2022-movie-poster_bWdpZ26UmZqaraWkpJRmZ21lrWxnZQ.jpg',
    'public/images/backgrounds/festival_hero.jpg': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&auto=format&fit=crop&q=85', # vibrant live concert laser stage
    'public/images/backgrounds/dragon_hero.jpg': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1920&auto=format&fit=crop&q=85',
    'public/images/backgrounds/login_hero.jpg': 'https://images.wallpapersden.com/image/download/the-batman-2022-movie-poster_bWdpZ26UmZqaraWkpJRmZ21lrWxnZQ.jpg',
}

headers = {'User-Agent': 'Mozilla/5.0'}

# Test downloading or fallback
for path, url in clean_assets.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            if len(data) > 10000:
                with open(path, 'wb') as f:
                    f.write(data)
                print(f"Downloaded clean {path} ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed {url}: {e}")
