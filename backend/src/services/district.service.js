import https from 'https';
import { INDIAN_LIVE_EVENTS } from '../data/indianEvents.data.js';
import { resolveEventAssets } from './eventAssets.js';

// Cache for real-time scraped events
let cachedLiveEvents = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch HTML from District by Zomato
 */
function fetchDistrictHtml(path = '/') {
  return new Promise((resolve) => {
    const req = https.get(
      `https://www.district.in${path}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 6000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    );

    req.on('error', () => resolve(''));
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
  });
}

/**
 * Parse live event cards from District by Zomato HTML
 */
function parseDistrictEvents(html, defaultCategory = 'comedy') {
  if (!html) return [];
  const links =
    html.match(/<a[^>]+href="https:\/\/www\.district\.in\/events\/[^"]+"[^>]*>[\s\S]*?<\/a>/gi) || [];
  const events = [];
  const seenUrls = new Set();

  for (const link of links) {
    const href = link.match(/href="([^"]+)"/)?.[1];
    if (!href || seenUrls.has(href)) continue;
    seenUrls.add(href);

    const video = link.match(/src="([^"]+\.mp4[^"]*)"/)?.[1] || null;
    const img = link.match(/<img[^>]+src="([^"]+)"/)?.[1] || null;
    const rawTexts = [...link.matchAll(/>([^<]+)</g)].map((m) => m[1].trim()).filter(Boolean);

    // Decode HTML entities like &#x27; -> '
    const texts = rawTexts.map((t) =>
      t
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    );

    if (texts.length >= 2) {
      let venue = 'Delhi/NCR, India';
      let title = '';
      let dateLabel = 'Upcoming';

      if (texts.length === 2) {
        title = texts[0];
        dateLabel = texts[1];
      } else if (texts.length === 3) {
        venue = texts[0];
        title = texts[1];
        dateLabel = texts[2];
      } else {
        const dateIdx = texts.findIndex((t) =>
          /mon|tue|wed|thu|fri|sat|sun|daily|slot|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(t)
        );
        if (dateIdx > 0) {
          dateLabel = texts[dateIdx];
          title = texts[dateIdx - 1];
          venue = texts.slice(0, dateIdx - 1).join(', ');
        } else {
          venue = texts[0];
          title = texts[1];
          dateLabel = texts.slice(2).join(' • ');
        }
      }

      if (title && !title.toLowerCase().includes('navratri') && !title.toLowerCase().includes('book now')) {
        // Detect city from venue
        let city = 'Delhi NCR';
        const vLower = venue.toLowerCase();
        if (vLower.includes('mumbai') || vLower.includes('thane') || vLower.includes('navi mumbai')) city = 'Mumbai';
        else if (vLower.includes('bengaluru') || vLower.includes('bangalore') || vLower.includes('karnataka')) city = 'Bengaluru';
        else if (vLower.includes('belagavi') || vLower.includes('belgaum')) city = 'Belagavi';
        else if (vLower.includes('pune')) city = 'Pune';
        else if (vLower.includes('goa')) city = 'Goa';
        else if (vLower.includes('hyderabad')) city = 'Hyderabad';
        else if (vLower.includes('kolkata')) city = 'Kolkata';
        else if (vLower.includes('chennai')) city = 'Chennai';

        // Detect category
        let category = defaultCategory;
        const tLower = title.toLowerCase();
        if (tLower.includes('comedy') || tLower.includes('standup') || tLower.includes('jokes') || tLower.includes('comic')) {
          category = 'comedy';
        } else if (tLower.includes('music') || tLower.includes('concert') || tLower.includes('live') || tLower.includes('tour')) {
          category = 'music';
        }

        // Price heuristic from title/category
        const price = category === 'comedy' ? '₹399 onwards' : '₹999 onwards';

        const rawEvent = {
          id: 'dt-' + href.split('/').pop().replace(/-buy-tickets$/, '').slice(0, 36),
          title,
          venue,
          city,
          cities: [city, 'all'],
          category,
          categoryLabel: category === 'comedy' ? 'STAND-UP COMEDY' : 'LIVE EXPERIENCE',
          dateLabel,
          price,
          priceVal: category === 'comedy' ? 399 : 999,
          videoUrl: video || 'https://b.zmtcdn.com/districts/events/files/690326e2be837b145ab66f65/cover_video_1772660168004.mp4',
          posterImage: img,
          ticketUrl: href,
          rating: 4.8,
          badge: 'DISTRICT LIVE',
        };
        const assets = resolveEventAssets(rawEvent);
        rawEvent.posterImage = assets.posterImage;
        rawEvent.backdropImage = assets.backdropImage;
        events.push(rawEvent);
      }
    }
  }

  return events;
}

/**
 * Fetch all real-time Indian events from District by Zomato + curated database
 */
export async function getRealTimeIndianEvents() {
  const now = Date.now();
  if (cachedLiveEvents && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedLiveEvents;
  }

  try {
    const [homeHtml, comedyHtml] = await Promise.all([
      fetchDistrictHtml('/'),
      fetchDistrictHtml('/events/comedy'),
    ]);

    const homeEvents = parseDistrictEvents(homeHtml, 'comedy');
    const comedyEvents = parseDistrictEvents(comedyHtml, 'comedy');

    // Combine scraped events
    const scrapedMap = new Map();
    for (const ev of [...homeEvents, ...comedyEvents]) {
      if (!scrapedMap.has(ev.ticketUrl)) {
        scrapedMap.set(ev.ticketUrl, ev);
      }
    }

    // Merge with high-quality curated INDIAN_LIVE_EVENTS (which have specific city distributions)
    const combined = [...INDIAN_LIVE_EVENTS];
    const existingTitles = new Set(INDIAN_LIVE_EVENTS.map((e) => e.title.toLowerCase().trim()));

    for (const ev of scrapedMap.values()) {
      if (!existingTitles.has(ev.title.toLowerCase().trim())) {
        combined.push(ev);
        existingTitles.add(ev.title.toLowerCase().trim());
      }
    }

    cachedLiveEvents = combined;
    lastCacheTime = now;
    return combined;
  } catch (err) {
    console.warn('[DistrictScraper] Error fetching live events:', err.message);
    return INDIAN_LIVE_EVENTS;
  }
}
