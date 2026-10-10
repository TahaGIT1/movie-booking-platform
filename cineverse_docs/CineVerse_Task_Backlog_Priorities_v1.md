# CineVerse Prioritized Task Backlog v1.0

## 1. How to use this backlog

Work from the top. Do not pull P2/P3 work into the active sprint while P0 acceptance tests are failing. The purpose of this board is to finish all basic functionalities first.


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


## 2. P0 task list - current sprint sequence

| ID | Area | Task | Dependency | Priority |
|---|---|---|---|---|
| P0-001 | Foundation | Create repo structure, env, lint, formatting, CI | none | P0 |
| P0-002 | DB | Run PostgreSQL migrations and seed roles/permissions | P0-001 | P0 |
| P0-003 | Auth | Register/login/logout/refresh | P0-002 | P0 |
| P0-004 | Auth | Permission middleware | P0-003 | P0 |
| P0-005 | Auth | Theatre tenant middleware | P0-004 | P0 |
| P0-006 | Admin | Movie CRUD | P0-004 | P0 |
| P0-007 | Admin | Theatre onboarding/approval | P0-005 | P0 |
| P0-008 | Manager | Theatre profile | P0-007 | P0 |
| P0-009 | Manager | Screen CRUD | P0-008 | P0 |
| P0-010 | Manager | Bulk seat creation/layout | P0-009 | P0 |
| P0-011 | Manager | Show scheduler | P0-006 + P0-009 | P0 |
| P0-012 | Manager | Base tier pricing | P0-011 | P0 |
| P0-013 | Customer | Home/discovery API/UI | P0-006 + P0-011 | P0 |
| P0-014 | Customer | Movie detail | P0-006 | P0 |
| P0-015 | Customer | Theatre/show selection | P0-011 + P0-013 | P0 |
| P0-016 | Backend | Show-seat inventory generation | P0-011 | P0 |
| P0-017 | Realtime | Redis seat lock | P0-016 | P0 |
| P0-018 | Realtime | Socket.io seat events | P0-017 | P0 |
| P0-019 | Customer | Seat map + timer | P0-018 | P0 |
| P0-020 | Backend | Checkout calculation | P0-019 | P0 |
| P0-021 | Backend | Coupon validation basic | P0-020 | P0 |
| P0-022 | Backend | Booking initiate | P0-020 | P0 |
| P0-023 | Backend | Mock payment adapter | P0-022 | P0 |
| P0-024 | Backend | Final booking transaction | P0-023 | P0 |
| P0-025 | Customer | Booking confirmation | P0-024 | P0 |
| P0-026 | Customer | QR ticket generation | P0-025 | P0 |
| P0-027 | Customer | My Bookings | P0-025 | P0 |
| P0-028 | Manager | Booking administration | P0-025 | P0 |
| P0-029 | Staff | Today's show roster | P0-008 + P0-011 | P0 |
| P0-030 | Staff | QR scanner | P0-026 | P0 |
| P0-031 | Staff | Six-point validation | P0-030 | P0 |
| P0-032 | Staff | Passback prevention | P0-031 | P0 |
| P0-033 | Manager | Occupancy dashboard | P0-024 | P0 |
| P0-034 | Admin | Audit log capture | P0-004 | P0 |
| P0-035 | Customer | Cancellation policy preview | P0-027 | P0 |
| P0-036 | Backend | In-app notifications | P0-025 + P0-035 | P0 |
| P0-037 | QA | Concurrent seat test | P0-017 + P0-024 | P0 |
| P0-038 | QA | End-to-end customer -> gate test | P0-032 | P0 |

## 3. P1 tasks

| ID | Task |
|---|---|
| P1-001 | Real payment adapter |
| P1-002 | Gateway webhook and reconciliation |
| P1-003 | Automated refund worker |
| P1-004 | Reviews and ratings |
| P1-005 | Watchlist |
| P1-006 | F&B catalogue and pre-order |
| P1-007 | Theatre offers |
| P1-008 | Report export |
| P1-009 | Email/SMS/push notifications |
| P1-010 | Smart seat finder |
| P1-011 | Dynamic pricing rules |
| P1-012 | Advanced manager/admin analytics |

> Note: real payment is now treated as P2 in the explicit project decisions above even though it appears in the source six-sprint roadmap. This board follows the user's current prioritization rather than the original schedule.

## 4. P2 tasks

| ID | Task |
|---|---|
| P2-001 | Production payment gateway integration |
| P2-002 | Real gateway refunds |
| P2-003 | Reconciliation worker |
| P2-004 | Read replicas and scale routing |
| P2-005 | Production observability / SLOs |
| P2-006 | Advanced geo-proximity services |

## 5. P3 tasks

| ID | Task |
|---|---|
| P3-001 | AI movie recommendation model |
| P3-002 | Conversational AI booking assistant |
| P3-003 | Google Wallet pass |
| P3-004 | Apple Wallet pass |
| P3-005 | Explainable recommendations |
| P3-006 | AI-driven demand / pricing intelligence |

## 6. Blockers and explicit non-blockers

### Must not block the basic product

- AI recommendation.
- Conversational AI.
- Wallet passes.
- Real payment provider credentials.
- Automated refund gateway integration.
- Fancy analytics.
- Map-heavy UI.

### Must block completion

- Auth and RBAC.
- Theatre/screen/seat setup.
- Movie/show catalogue.
- Customer discovery.
- Seat map.
- Redis lock.
- Booking transaction.
- QR ticket.
- Staff scanner.
- Basic manager visibility.
- Audit logs.

## 7. Release gates

### Gate A - Foundation
Auth + roles + tenant isolation pass.

### Gate B - Inventory
Manager can publish a show and customer sees its seats.

### Gate C - Concurrency
Two users cannot buy the same seat.

### Gate D - Ticket lifecycle
Customer gets QR and staff can validate it.

### Gate E - Operational release
Cancellation, audit, notifications and basic analytics work.

Only after Gate E should P1/P2/P3 features be promoted into the main release branch.
