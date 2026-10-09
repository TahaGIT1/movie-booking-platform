# CineVerse Product Requirements Document (PRD) v2.0

## 1. Document purpose

This PRD converts the supplied CineVerse role/functionality specification into an execution-ready product baseline. The original product defines a four-role cinema ticketing ecosystem: Customer, Theatre Manager, Theatre Staff, and Super Admin. The supplied specification also defines a ten-stage customer funnel from discovery through gate entry and a 28-module RBAC matrix. {"The four-role model and 10-stage funnel are the product foundation."}

The current project scope is deliberately prioritized so that the team can finish a complete, demonstrable ticket-booking platform before adding AI recommendation, conversational booking AI, real payment gateways, and wallet integrations.

## 2. Product vision

CineVerse is a multi-tenant cinema ticketing platform that lets customers discover movies and theatres, choose showtimes, select seats, complete a booking, receive a QR ticket, and present that ticket at the theatre gate. Theatre managers configure their own screens, seats, shows, pricing, staff, and operational dashboards. Theatre staff validate tickets. Super Admin controls the master catalogue, tenant approvals, policies, users, coupons, and audit logs.

The source specification describes the customer booking lifecycle as: Discover -> Filters/Compare -> Movie -> Theatre -> Show -> Seats -> Offer -> Pay -> Ticket -> Enter. This PRD keeps that lifecycle while making payment gateway integration a later dependency rather than a blocker. [Source: provided CineVerse specification]


## Priority policy for the current build

| Priority | Meaning | Delivery rule |
|---|---|---|
| **P0 - NOW / MUST SHIP** | Core product must work end-to-end without these features the project is incomplete. | Implement before moving to polish. |
| **P1 - NEXT / IMPORTANT** | Strong product completeness, but does not block the first working ticket lifecycle. | Build immediately after P0. |
| **P2 - DEFERRED** | Useful production capability, intentionally not on the current critical path. | Design interfaces now; integrate later. |
| **P3 - FUTURE / ADVANCED** | AI, wallet, and other advanced experiences. | Do not block the base application. |

### Explicit project decisions

1. **AI movie recommendation is deferred to P3.** Keep preference fields and event data so the feature can be added later, but do not build the recommendation model now.
2. **Conversational AI booking assistant is deferred to P3.** No LLM dependency is required for the core release.
3. **Real payment gateway integration is deferred to P2.** Build a payment abstraction and a deterministic **Mock Payment Adapter** in P0 so that booking, QR generation, cancellation rules, and scanner flows can be tested end-to-end.
4. **Wallet integrations (Google/Apple or similar) are deferred to P3.** The first release should support a downloadable digital ticket / QR and a simple share action instead.
5. **Smart seat recommendation is not a blocker.** Normal seat selection and real-time locking are P0; the heuristic "Best View / Couple / Cheapest / Near Exit / Accessible" helper is P1/P2 depending on team capacity.
6. **Refund gateway automation is deferred with real payments.** The database must still record cancellation and refund intent so the workflow can be integrated later without changing the booking model.


## 3. Personas and permissions

### 3.1 Customer

Primary goals: discover movies, search, filter, see theatres/showtimes, select seats, hold seats safely, book tickets, view bookings, cancel according to policy, download/share QR tickets, and later use recommendations.

### 3.2 Theatre Manager

Primary goals: manage the assigned theatre, screens, seat layout, shows, tier pricing, theatre-specific offers, staff accounts, bookings, and operational analytics. The source requires strict theatre-level isolation and prevents managers from modifying global movie metadata or completed payment ledger records. [Source: provided CineVerse specification]

### 3.3 Theatre Staff

Primary goals: view today's assigned shows and validate customer tickets at the gate. Staff have a deliberately narrow operational permission set and no revenue, pricing, or catalogue administration access. [Source: provided CineVerse specification]

### 3.4 Super Admin

Primary goals: global user management, theatre KYC/approval, master movie catalogue, global pricing/coupon rules, platform analytics, health monitoring, audit logs, and RBAC governance. The supplied specification explicitly assigns global movie authority and theatre approval to Super Admin. [Source: provided CineVerse specification]

## 4. Functional requirements by priority

### 4.1 P0 - Customer core journey

| ID | Requirement | Acceptance criteria |
|---|---|---|
| P0-C01 | Register / login / logout | Email/password works; JWT access token + refresh flow works; blocked accounts are rejected; logout revokes refresh token. |
| P0-C02 | Customer profile | View/edit name, mobile, profile photo, preferences. |
| P0-C03 | Home discovery | Now Showing and Coming Soon lists are available. |
| P0-C04 | Search and filters | Search title, actor/cast, theatre, genre; filter by language, genre, date, format, price, distance where data exists. |
| P0-C05 | Movie details | Poster, title, synopsis, duration, language, genre, certificate, director, cast, trailer link, ratings summary. |
| P0-C06 | Theatre + show discovery | Movie -> city -> date -> theatre -> show flow works, with theatre distance/rating/capacity metadata where available. |
| P0-C07 | Seat selection | Exact seat layout shows Available, Locked, Booked, Unavailable/Broken. |
| P0-C08 | Real-time seat lock | Selecting a seat obtains a 5-minute Redis lock; another user receives immediate conflict; expiry releases the lock. |
| P0-C09 | Booking checkout | Itemized subtotal, taxes, convenience fee, discount, final total. |
| P0-C10 | Mock payment | A deterministic test adapter simulates INITIATED -> PROCESSING -> SUCCESS/FAILED without external gateway dependency. |
| P0-C11 | Booking confirmation | Confirmed booking has a unique booking reference, seat records, payment record, and QR payload/hash. |
| P0-C12 | Digital ticket | Customer can view and download a ticket containing booking ID, movie, theatre, screen, show time, seats, and QR. |
| P0-C13 | My Bookings | Upcoming, completed and cancelled views with ticket details. |
| P0-C14 | Cancellation | Cutoff validation and transparent fee calculation; refund intent is recorded even when real refund gateway is deferred. |
| P0-C15 | Basic notifications | In-app event notifications for booking confirmed, cancellation, lock expiry, and ticket validation status. |

### 4.2 P0 - Theatre Manager

| ID | Requirement | Acceptance criteria |
|---|---|---|
| P0-M01 | Theatre onboarding | Manager/application record supports PENDING -> DOCS_VERIFIED -> APPROVED -> ACTIVE. |
| P0-M02 | Theatre profile | Address, contact details, amenities, operating information. |
| P0-M03 | Screen management | Create/edit/disable screens; define format, capacity and sound. |
| P0-M04 | Seat layout | Configure rows, seat numbers, tier, accessibility, grid position, broken/unavailable state. |
| P0-M05 | Show scheduling | Create/edit/cancel shows; reject overlapping shows on same screen. |
| P0-M06 | Base pricing | Configure Normal/Premium/Recliner price tiers per show. |
| P0-M07 | Booking administration | Search/filter theatre bookings and inspect customer, seats and status. |
| P0-M08 | Basic analytics | Sold seats, available seats, occupancy percentage, gross booking value by show/day. |
| P0-M09 | Staff management | Add/disable staff; assign scanner permissions; isolate by theatre. |

### 4.3 P0 - Theatre Staff

| ID | Requirement | Acceptance criteria |
|---|---|---|
| P0-S01 | Staff login | Staff authenticate and see only assigned theatre data. |
| P0-S02 | Today's roster | Only today's relevant theatre shows are visible. |
| P0-S03 | QR scanner | Camera/web scanner reads QR payload. |
| P0-S04 | Six-point validation | Booking exists, correct theatre, correct screen, correct show/date, payment state acceptable, ticket UNUSED. |
| P0-S05 | Passback prevention | First successful scan atomically changes UNUSED -> USED; second scan is rejected. |

The six-point gate validation workflow is explicitly defined in the supplied specification and is a P0 operational function. [Source: provided CineVerse specification]

### 4.4 P0 - Super Admin

| ID | Requirement | Acceptance criteria |
|---|---|---|
| P0-A01 | Admin dashboard | Global user/theatre/movie/booking counters. |
| P0-A02 | User management | Search, block/unblock, suspend/delete where policy allows, inspect booking history. |
| P0-A03 | Theatre approval | Review documents and transition status with audit trail. |
| P0-A04 | Movie master catalogue | Add/edit/archive movies; poster/trailer; cast/director/genre/language/certificate/release date. |
| P0-A05 | Global policies | Convenience fee, tax, cancellation policy, max discount controls. |
| P0-A06 | Global coupons | Create, activate/deactivate, usage limits and eligibility rules. |
| P0-A07 | Audit logs | Sensitive changes store actor, action, target, IP/device, old value, new value. |
| P0-A08 | System health | Basic API, DB, Redis, WebSocket health checks. |

## 5. P1 - Next wave

Reviews and ratings, watchlist, theatre photos/amenities polish, F&B pre-order, theatre offers, report export, advanced analytics, email/SMS/push notifications, dynamic pricing rules, smart seat finder, automated refund worker, and real payment gateway integration can be delivered after the P0 lifecycle is stable.

The source specification includes reviews/watchlist, F&B, local offers, detailed reporting, and multi-channel notifications. These remain part of the product, but are not allowed to delay the first fully working ticket lifecycle. [Source: provided CineVerse specification] [Source: provided CineVerse specification]

## 6. P2 - Deferred production integrations

- Real UPI/card/net-banking payment gateway integration.
- Gateway webhooks, reconciliation workers, real refund execution.
- Advanced geo-proximity services and map UX.
- Read-replica routing and scale optimizations.
- Stronger production observability and SLO dashboards.

The supplied TRD already establishes the payment abstraction, deterministic payment states, webhook idempotency and reconciliation as the target architecture; only the schedule has been moved later for this project phase. [Source: provided CineVerse specification]

## 7. P3 - Future / advanced

- AI movie recommendation engine.
- Conversational AI booking assistant.
- Google/Apple wallet passes.
- Explainable recommendation prompts and advanced personalization.
- Advanced demand forecasting / dynamic pricing intelligence.

The source PRD labels the conversational booking assistant as an advanced module and bases recommendations on booking history, watched movies, genres, actors, directors, ratings, language, location and local popularity. [Source: provided CineVerse specification]

## 8. Non-functional requirements

The source requirements target discovery P95 <= 150 ms, seat hold acquisition/release <= 50 ms, and gate validation <= 400 ms. They also require Redis atomic locking, PostgreSQL row-level locking at commit, claims-based permissions rather than hardcoded role checks, strong password hashing, HMAC verification for callbacks, and high availability for checkout. [Source: provided CineVerse specification]

For the student/project build, these should be treated as engineering targets. The first milestone should prove correctness and concurrency before attempting production-scale availability.

## 9. Core acceptance test: one complete ticket

A release candidate is considered functionally complete only when a tester can:

1. Log in as customer.
2. Search and open a movie.
3. Pick a theatre and date.
4. Select a show.
5. Select 1-3 seats.
6. Observe a 5-minute lock and real-time seat state.
7. Enter checkout and see a deterministic bill.
8. Complete the mock payment.
9. Receive a confirmed booking and QR ticket.
10. Open My Bookings and download/share the ticket.
11. Log in as theatre staff.
12. Scan the QR and receive ALLOW ENTRY.
13. Scan the same QR again and receive PASSBACK / ALREADY USED.

## 10. Product success criteria for the current milestone

- No duplicate seat assignment under concurrent seat-selection testing.
- Manager cannot access another theatre's operational resources.
- Staff cannot access pricing, movie administration, or revenue controls.
- Admin actions create audit entries.
- Booking state is deterministic and recoverable.
- AI and wallet features are fully decoupled and do not block the build.


---

**Document status:** Project working baseline. This package preserves the supplied CineVerse requirements and explicitly separates current MVP priorities from deferred capabilities.

**Source basis:** CineVerse Role & Functionality Specification v1.0 (provided PDF); Pasted text containing the PRD/TRD/flow/schema/implementation baseline (provided file). No external research was used.
