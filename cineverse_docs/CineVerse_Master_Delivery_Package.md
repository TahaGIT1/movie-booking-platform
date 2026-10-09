# CineVerse Engineering Delivery Package

## Current scope decision

Build the complete basic ticketing lifecycle first. AI recommendation, conversational AI, real payment gateway and wallet integrations are deferred.

## Included documents

1. PRD v2.0
2. TRD v2.0
3. Application Flow v2.0
4. Backend + Database Schema v2.0
5. Implementation Plan v2.0
6. Prioritized Task Backlog v1.0
7. PostgreSQL SQL schema


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


## Core delivery definition

The current release is complete when the team can run a full Customer -> Seat Lock -> Mock Payment -> Booking -> QR Ticket -> Staff Scan flow without double-booking and with RBAC/tenant isolation.

## Source traceability

The four-role governance model, 10-stage funnel, seat locking architecture, six-point gate validation and 28-module permissions originate from the supplied CineVerse specification. The priority changes are project execution decisions added in this package.
