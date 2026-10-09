import os
import urllib.request

ASSETS = {
    # Sports
    "public/images/sports/f1-night-race.jpg": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=700&auto=format&fit=crop&q=85",
    "public/images/sports/premier-league.jpg": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=700&auto=format&fit=crop&q=85",
    "public/images/sports/badminton-open.jpg": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=700&auto=format&fit=crop&q=85",
    "public/images/sports/vct-esports.jpg": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=85",
    "public/images/sports/sports_hero.jpg": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1920&auto=format&fit=crop&q=85",

    # Plays
    "public/images/plays/phantom-opera.jpg": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=700&auto=format&fit=crop&q=85",
    "public/images/plays/hamilton.jpg": "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=700&auto=format&fit=crop&q=85",
    "public/images/plays/les-miserables.jpg": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=700&auto=format&fit=crop&q=85",
    "public/images/plays/macbeth.jpg": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&auto=format&fit=crop&q=85",
    "public/images/plays/plays_hero.jpg": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1920&auto=format&fit=crop&q=85",

    # Activities
    "public/images/activities/zero-latency-vr.jpg": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=700&auto=format&fit=crop&q=85",
    "public/images/activities/rud-karting.jpg": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=700&auto=format&fit=crop&q=85",
    "public/images/activities/breakout-escape.jpg": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop&q=85",
    "public/images/activities/district21-adventure.jpg": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=700&auto=format&fit=crop&q=85",
    "public/images/activities/activities_hero.jpg": "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1920&auto=format&fit=crop&q=85",

    # Extra Movies
    "public/images/movies/oppenheimer.jpg": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop&q=85",
    "public/images/movies/gladiator2.jpg": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=700&auto=format&fit=crop&q=85",
    "public/images/movies/deadpool-wolverine.jpg": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=700&auto=format&fit=crop&q=85",
    "public/images/movies/interstellar.jpg": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=85",
}

def download_all():
    for filepath, url in ASSETS.items():
        dirname = os.path.dirname(filepath)
        if dirname and not os.path.exists(dirname):
            os.makedirs(dirname, exist_ok=True)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                with open(filepath, 'wb') as f:
                    f.write(data)
                print(f"[OK] {filepath} ({len(data)} bytes)")
        except Exception as e:
            print(f"[ERR] {filepath}: {e}")

if __name__ == '__main__':
    download_all()
