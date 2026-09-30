# Technical Decisions

| ID | Date | Context | Decision | Rationale | Status |
|---|---|---|---|---|---|
| D1 | [Spec Override] | Architecture | Firebase (Firestore + Auth + Storage) | Human explicitly overrode the Supabase requirement in favour of Google Firebase. | Accepted |
| D2 | [Spec] | Data Model | Global date-keyed card | Scheduled content, robust streaks. | Accepted |
| D3 | [Spec] | Timezone | Day boundary = Asia/Dhaka | Streaks survive travel/midnight. | Accepted |
| D4 | [Spec] | Storage | IDB for cards/progress, localStorage for prefs | IDB supports large data async. | Accepted |
| D5 | [Spec] | PWA | Service Worker (cache-first + SWR) | Offline capability. | Accepted |
| D6 | [Spec] | Admin | Separate page, RLS protected | True database-level security. | Accepted |
| D7 | [Spec] | Payments | Out of scope for v1 | Ship value first. | Accepted |
| D8 | [Spec] | Fonts | Self-hosted Bangla fonts | Precached for offline use. | Accepted |
