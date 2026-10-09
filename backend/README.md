# CinePass API Server & Fullstack Architecture

Backend REST API service for the CinePass Movie & Event Booking Platform. Built with Node.js, Express, TypeScript, and Zod.

## Getting Started

### 1. Install & Run Backend
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The client will start on `http://localhost:5173` and automatically proxy `/api` calls to `http://localhost:5000`.

---

## API Endpoints Reference

### Health Check
- `GET /api/health` — Service status and server timestamp.

### Movies & Media Catalog
- `GET /api/movies` — List movies. Supports query parameters:
  - `?search=<term>` — Filter by title, genre, or cast
  - `?genre=<genre>` — Filter by genre
  - `?status=now|upcoming` — Filter by showing status
- `GET /api/movies/:id` — Detailed movie metadata.
- `GET /api/events` — Concerts, comedy, and festival events.
- `GET /api/events/:id` — Event details.
- `GET /api/streams` — 4K digital stream premieres.
- `GET /api/plays` — Broadway and theatre season shows.
- `GET /api/sports` — Stadium screenings and match fixtures.
- `GET /api/activities` — Attractions, VR zones, and go-kart passes.

### Theatres & Venues
- `GET /api/theatres` — Cinema halls. Supports `?city=<city>` filter.
- `GET /api/theatres/:id` — Single theatre details.

### Offers & Promotions
- `GET /api/offers` — Discount coupon codes and card deals.

### Bookings & Reservations
- `GET /api/bookings` — List all user reservations and ticket records.
- `GET /api/bookings/:orderId` — Single booking receipt by order ID.
- `GET /api/bookings/occupied-seats?theatre=...&date=...&time=...` — Returns already occupied seats for that showtime.
- `POST /api/bookings` — Create a ticket reservation.
  - **Payload**:
    ```json
    {
      "mediaId": "the-batman",
      "theatreName": "IMAX Pavilion Elite KL",
      "date": "Tomorrow, Oct 8",
      "time": "06:30 PM",
      "seats": ["E7", "E8"],
      "totalAmount": 76.0,
      "customerName": "Marcus Levin",
      "customerEmail": "marcus@example.com"
    }
    ```
  - **Validation & Conflict Handling**: Validated with Zod schema. Returns `409 Conflict` if any of the selected seats are already booked.

### Search
- `GET /api/search?q=<keyword>` — Unified multi-collection search across movies, events, streams, plays, sports, and activities.
