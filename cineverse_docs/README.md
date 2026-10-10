# CineVerse documentation bundle

This bundle contains the execution-ready PRD, TRD, application flows, backend/database schema, implementation plan and prioritized task backlog.

## Files

- `CineVerse_PRD_v2.md` - Product scope, requirements, acceptance criteria and priority decisions.
- `CineVerse_TRD_v2.md` - Architecture, APIs, RBAC, Redis locking, transactions, security and testing.
- `CineVerse_App_Flow_v2.md` - Customer, Manager, Staff, Admin, seat-lock, booking and onboarding flows.
- `CineVerse_Backend_DB_Schema_v2.md` - Entity model, tables, relationships, Redis keys and consistency rules.
- `CineVerse_DB_Schema_v2.sql` - Executable PostgreSQL schema.
- `CineVerse_Implementation_Plan_v2.md` - Phase-by-phase engineering roadmap.
- `CineVerse_Task_Backlog_Priorities_v1.md` - P0/P1/P2/P3 task board.

## Current product decision

Finish the core end-to-end booking flow first. Real payment integration, wallet integration, AI recommendation and conversational AI are deliberately deferred so they cannot block basic functionality.
