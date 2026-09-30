# SHOBDO DAILY — AGENT MASTER SPEC
**Audience:** Gemini 3.1 Pro (or whichever model Antigravity assigns) running under `/teamwork-preview`
**Goal:** Take the mocked single-file prototype to a fully working, debugged, offline-first PWA with real auth, a real data pipeline, and an admin dashboard.
**Status of this document:** Binding. Where this spec and an agent's preference conflict, the spec wins. Where the spec is silent, follow the Decision Protocol (§13).

> Note: Antigravity's command is currently `/teamwork-preview` (a preview feature). It picks team size and structure itself. This spec therefore constrains *what* must be true and *who may touch what*, not how many agents exist. Artifact filenames below (PLAN.md, etc.) are this project's convention, not Antigravity built-ins.

---

## PART A — KICKOFF PROMPT (paste after the command)

```
/teamwork-preview
Read docs/MASTER_SPEC.md in full before doing anything. It is binding.
Project: Shobdo Daily — offline-first PWA vocabulary app for Bangladeshi exam candidates.
Start with Phase 0 (audit). Do not write feature code until the Phase 0 gate in §9 passes.
Work inside the repo workspace only. Use an integrity level of maximum verification:
every milestone needs independent verification by an agent that did not write the code.
Report progress by updating docs/PLAN.md, docs/TASKS.md, docs/DECISIONS.md,
docs/DEBUG_LOG.md and docs/VERIFICATION.md. Stop and ask me only under §13 escalation rules.
```

Setup: save this file as `docs/MASTER_SPEC.md` in the repo root before kickoff.

---

## 1. PRODUCT INVARIANTS (never violate, never "improve")

These protect the product's whole value proposition: habit through extreme simplicity.

| # | Invariant |
|---|-----------|
| P1 | Exactly **one card per day** on Home: 1 English sentence, **2** vocabulary words, 1 contextual image, Bangla translations. |
| P2 | **No onboarding tutorial, no signup wall.** A first-time visitor sees today's card within one interaction of opening the app. Guest mode is the default. |
| P3 | Navigation stays minimal (Home, Archive/Bookmarks, Settings). Do not add tabs, feeds, quizzes, gamification, or leaderboards in v1. |
| P4 | **Offline-first:** after first successful load, Home, today's card, images, and Settings work with airplane mode on. |
| P5 | UI never blocks on the network. Local state renders first; sync happens in the background. |
| P6 | Bangla text must render correctly everywhere (no tofu boxes, correct conjuncts, correct line-height) — including offline. |
| P7 | Existing theme system (System/Navy, Warm Cream, White), reminder time, Learned, Bookmark, and Reset flows keep their current behaviour and look. |

Any feature that violates P1–P7 is rejected in review regardless of quality.

---

## 2. INPUT GAP — PHASE 0 MUST HANDLE THIS FIRST

The reference file `shobdo-daily-app.html` supplied with this brief was **0 bytes** at the time this spec was written. The narrative overview (vision, architecture, mock status) is therefore the only source of truth for the prototype.

**Rules:**
1. Agent locates the actual prototype in the repo (`index.html`, plus `sw.js` and the Vite scaffold if present).
2. If the prototype is missing or empty → **halt and ask the human** (§13). Do not "recreate from imagination" the custom UI the human called "cool"; visual fidelity to the original is a requirement.
3. If present → Explorers produce `docs/AUDIT.md` (see §9, M0) before any change.

---

## 3. HARD RULES (constrained behaviour)

**Scope & safety**
- R1. Work only inside the project workspace. Never touch files outside it. Never run destructive commands (`rm -rf` outside `dist/`/`node_modules/`, `git push --force`, DB drops on any non-local database).
- R2. **No secrets in the repo or client bundle.** Only the public/anon backend key may reach the browser. Service-role keys live in `.env.local` (gitignored) or server-side functions only. Commit `.env.example` with placeholder values.
- R3. Never fabricate credentials, API keys, project IDs, or third-party responses. If a real backend project is needed and not provided, build against the **local emulator/local Postgres** and ask the human for real credentials at the M6 gate.
- R4. Never claim something works unless it was executed and observed. "Should work" is forbidden in reports. Every claim links to a command output, screenshot, or test result in `docs/VERIFICATION.md`.

**Code discipline**
- R5. Stack: HTML5, CSS3 with CSS variables, **vanilla ES2022 modules**. **No React/Vue/Svelte, no CSS frameworks, no jQuery.** Vite stays as dev server/bundler only. Allowed runtime dependency: the backend client SDK (lazy-loaded; must not block first paint). Any other dependency needs a DECISIONS.md entry with size cost and justification.
- R6. Split the monolithic `index.html` into ES modules (§5). Behaviour and pixels must remain identical after the split (regression-checked in M1).
- R7. **Never use `innerHTML` with dynamic data.** Use `textContent`/`createElement`/`template` cloning. Admin-authored content is still untrusted.
- R8. No `eval`, no inline event handlers, no inline `<script>` bodies in the final build (required for a strict CSP).
- R9. Every function that touches dates, storage, or the network has a unit test. Pure logic is separated from DOM code so it is testable.
- R10. No silent `catch {}`. Errors are handled, logged via the `log` module, and surfaced to the user only when actionable.
- R11. Every file has a single owner track (§8). Agents do not edit files they don't own; they request changes via `docs/TASKS.md`.

**Process**
- R12. Small commits, one concern each, conventional-commit messages. Each commit must leave `npm test` and `npm run build` green.
- R13. **Independent verification:** the agent that wrote code may not sign off on it. A Verifier signs off each milestone.
- R14. A bug fix is not complete until a **regression test that failed before the fix** exists and passes after (§10).
- R15. Do not expand scope. Anything not in this spec goes to `docs/BACKLOG.md`, not into code.
- R16. Do not delete or weaken a failing test to get green. Fix the code or escalate.

---

## 4. TECHNICAL DECISIONS (already made; change only via §13)

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | **Supabase** (Postgres + Auth with Google OAuth + Storage + Row-Level Security + Edge Functions). Firebase is *not* used. | One vendor covers auth, relational data, storage, and admin access control. Streak/analytics queries are natural in SQL. Wrap in `src/data/adapter.js` so a swap stays possible. |
| D2 | **Global date-keyed card.** Card for date *D* is the same for every user. Users can browse past cards in Archive. | Lets admins schedule content; replaces the per-user `sessionStart` day-count, which breaks if the device clock changes. |
| D3 | **Day boundary = user's timezone, default `Asia/Dhaka` (UTC+6).** Day keys are `YYYY-MM-DD` strings, never raw timestamps. | Streaks must survive midnight, travel, and clock drift. |
| D4 | **Local-first store:** `localStorage` for small prefs (theme, reminder time); **IndexedDB** for cards, progress, sync queue, and cached media metadata. | localStorage is synchronous, ~5 MB, and unsuitable for media/queue data. |
| D5 | **Service worker** with a versioned cache: cache-first for the app shell, stale-while-revalidate for card JSON, cache-first with size cap for images/audio. | Standard PWA pattern; predictable update behaviour. |
| D6 | **Admin dashboard** is a separate page (`/admin/`) in the same vanilla stack. Authorization is enforced by **RLS + role claim**, never by hiding UI. | Client-side hiding is not security. |
| D7 | Payments are **out of scope**. "Premium" is a boolean entitlement (`profiles.is_premium`) that an admin can grant. Bulk download checks the flag. | Ship value first; add bKash/Nagad later via BACKLOG. |
| D8 | Bangla fonts (Noto Sans Bengali or Hind Siliguri) are **self-hosted** (woff2, subsetted) and precached. | No CDN dependency offline; consistent conjunct rendering. |

---

## 5. TARGET ARCHITECTURE & FILE OWNERSHIP

```
/
├─ index.html                # shell only (no inline JS/CSS)
├─ admin/index.html          # admin shell
├─ sw.js                     # service worker         [Track: PWA]
├─ manifest.webmanifest      # PWA manifest           [Track: PWA]
├─ src/
│  ├─ app/        main.js, router.js, views/*.js       [Track: Client]
│  ├─ styles/     tokens.css, base.css, themes.css     [Track: Client]
│  ├─ core/       dates.js, streak.js, state.js, log.js [Track: Core]  (pure, tested)
│  ├─ data/       adapter.js, supabase.js, idb.js,
│  │              sync.js, merge.js, prefetch.js       [Track: Data]
│  ├─ auth/       auth.js, guest.js, migrate.js        [Track: Auth]
│  ├─ notify/     reminders.js, push.js                [Track: Notify]
│  └─ admin/      cards.js, calendar.js, users.js,
│                 analytics.js, audit.js               [Track: Admin]
├─ supabase/
│  ├─ migrations/*.sql, seed.sql, policies.sql, functions/  [Track: Backend]
├─ tests/  unit/ (Vitest)  e2e/ (Playwright)           [Track: QA — read-only for others]
└─ docs/   MASTER_SPEC.md PLAN.md TASKS.md DECISIONS.md DEBUG_LOG.md
           VERIFICATION.md AUDIT.md BACKLOG.md RUNBOOK.md
```

**Client state shape (canonical):**
```js
{
  version: 1,
  prefs:   { theme, reminderTime, tz },
  session: { mode: 'guest'|'authed', userId|null },
  progress:{ learned: {cardId: isoTs}, bookmarks: {cardId: isoTs} },
  activity:{ days: ['YYYY-MM-DD', ...] },   // days on which today's card was completed
  syncQueue: [{ id, op, payload, ts, tries }]
}
```
Migrations between `version` values are mandatory and tested. `S.authed` is replaced by `session.mode`.

---

## 6. DATA MODEL (Backend track)

```sql
-- roles: 'user' | 'editor' | 'admin'
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text, role text not null default 'user',
  is_premium boolean not null default false,
  tz text not null default 'Asia/Dhaka',
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  publish_date date unique,                       -- Asia/Dhaka calendar day
  status text not null default 'draft'
    check (status in ('draft','scheduled','published','archived')),
  sentence_en text not null, sentence_bn text not null,
  image_path text, image_alt text,
  exam_tags text[] default '{}',                  -- BCS, IELTS, BANK, MBA
  created_by uuid references profiles(id),
  updated_at timestamptz default now()
);

create table card_words (
  card_id uuid references cards(id) on delete cascade,
  position smallint check (position in (1,2)),
  word text not null, part_of_speech text,
  meaning_bn text not null, meaning_en text,
  pronunciation text, example_en text, audio_path text,
  primary key (card_id, position)
);

create table user_progress (
  user_id uuid references profiles(id) on delete cascade,
  card_id uuid references cards(id) on delete cascade,
  learned_at timestamptz, bookmarked_at timestamptz,
  updated_at timestamptz default now(),
  primary key (user_id, card_id)
);

create table user_activity (                       -- one row per user per local day
  user_id uuid references profiles(id) on delete cascade,
  day date not null, completed_at timestamptz default now(),
  primary key (user_id, day)
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid, action text, entity text, entity_id text,
  diff jsonb, at timestamptz default now()
);
```

**RLS requirements (all tables have RLS enabled; default deny):**
- `cards`/`card_words`: everyone (including anon) may `select` rows where `status='published' and publish_date <= today_bd()`. Editors/admins may insert/update. Only admins may delete or change roles.
- `user_progress`, `user_activity`: a user may read/write **only their own rows**.
- `profiles`: users read/update own row **except** `role` and `is_premium` (enforced by trigger or column-level policy; test it).
- `audit_log`: insert via trigger only; admin read-only.
- Provide `today_bd()` = `(now() at time zone 'Asia/Dhaka')::date`.
- Provide analytics as **SQL views/RPCs restricted to admins**: DAU/WAU/MAU, D1/D7/D30 retention, streak-length distribution, learned rate per card, most-bookmarked words.
- Privacy: no personal analytics beyond the tables above. No third-party trackers.

**Storage:** a public-read `card-media` bucket, write restricted to editors/admins. Uploads validated: image/webp|jpeg|png, ≤ 300 KB after client resize, audio/mpeg|ogg ≤ 200 KB.

---

## 7. FEATURE SPECIFICATIONS

### 7.1 Today's card & fallbacks
1. Compute `todayKey = dayKey(now, tz)`.
2. Look up local IDB cache for `publish_date === todayKey`. Render immediately if found.
3. Background-fetch from backend; update cache; re-render only if content changed.
4. **Fallback ladder:** (a) exact date → (b) most recent published card, labelled subtly as "latest" → (c) bundled seed cards shipped in the app (`seed.json`, ≥ 30 cards) so a brand-new offline user is never empty.
5. Admin dashboard flags any of the next 7 days that lack a card.

### 7.2 Streaks (must be correct — this is the retention mechanic)
- Streak = count of consecutive day keys in `activity.days` ending today or yesterday.
- A day counts when the user **completes** the card (define completion once: "marked learned" OR "flipped/read both words"; record the choice in DECISIONS.md and keep it consistent everywhere).
- Client computes optimistically; server recomputes from `user_activity` and wins on conflict.
- **Clock-tamper defence:** reject a day key more than 1 day ahead of last server time seen; cap backfill to 1 day; server validates `completed_at` skew ≤ 24 h.
- Guest streaks are local only and are labelled as such.

### 7.3 Auth (replace the mock)
- Guest is default; nothing is gated for guests.
- Settings offers "Sign in with Google" → Supabase OAuth (PKCE). Sign-out returns to guest mode without wiping local data unless the user chooses Reset.
- **Guest → account migration (`auth/migrate.js`)** merges, never overwrites:
  - learned & bookmarks: set-union; conflicting timestamps → keep the later; explicit un-bookmark tombstones win over older adds.
  - activity days: set-union, then recompute streak.
  - prefs: local wins unless the account has newer `updated_at`.
- Migration is idempotent (running twice yields the same result) and has property-style tests.
- Session refresh works offline: an expired token must not log the user out while offline; it retries on reconnect.

### 7.4 Sync
- All mutations write locally first, then enqueue to `syncQueue`.
- Queue flush: on reconnect, on app foreground, and every N minutes while open; exponential backoff with jitter; max tries then park item and surface a quiet indicator.
- Operations are **idempotent** (upserts keyed by `(user_id, card_id)`), so duplicate delivery is harmless.
- Use Background Sync where supported, with a foreground fallback (Safari lacks it).

### 7.5 Offline & PWA
- `manifest.webmanifest` with maskable icons; installable on Android Chrome; "Add to Home Screen" instructions for iOS surfaced only in Settings (no popups — P2).
- Service worker: versioned cache names; on update, new SW waits and the app shows a small non-blocking "Update ready" control (never auto-reload mid-study).
- Precache: shell, fonts, current theme CSS, seed cards, icons.
- **Prefetch policy:** free users → today + next 2 days (data + image). Premium → "Bulk Download" of next 30 days including audio.
- Bulk download: check `navigator.storage.estimate()` first, show progress, be resumable, be cancellable, evict oldest-first under a size cap, request `navigator.storage.persist()`.

### 7.6 Notifications (be honest about platform limits)
- The `Notification` API called from an open page **only fires while the app is open**. That is the current prototype's behaviour and it is **not** a real reminder.
- Real reminders require **Web Push** (VAPID) from a server-side scheduled function + service-worker `push` handler. Implement: subscribe on opt-in, store subscription server-side per user, daily cron at each user's `reminderTime` in their tz, payload = today's headline word.
- iOS: Web Push works only for PWAs installed to the Home Screen (iOS/iPadOS 16.4+). Detect and explain in Settings; never nag.
- Guests can receive push too (store an anonymous subscription id); reminders are never sent if today's card is already completed.
- If push is unavailable, fall back to the in-page notification and state the limitation in Settings copy.

### 7.7 Admin dashboard (`/admin/`)
Access: sign-in required, role `editor` or `admin` verified server-side via RLS; non-admins receive a generic 404-style page, and all data calls fail at the database regardless.

Modules (all must be functional in v1):
1. **Card editor:** create/edit/duplicate; live preview identical to the user card (reuse the same render module); image upload with auto-resize/WebP conversion; alt text required; **validation** — exactly 2 words, Bangla fields present, sentence contains both target words (warn if not), no duplicate word within the last 180 days (warn).
2. **Calendar scheduler:** month grid, drag or pick a date, gap highlighting, status badges, prevent two cards on one date.
3. **Bulk import:** CSV/JSON with a dry-run validation report before commit.
4. **Analytics:** DAU/WAU/MAU, retention curves, streak distribution, learned rate, top bookmarks, install count. Simple SVG charts (no chart library unless justified per R5).
5. **Users:** read-only list with search; grant/revoke `is_premium`, promote/demote editor (admin only). No access to another user's private progress beyond aggregates and counts.
6. **Audit log viewer:** every admin mutation recorded (who, what, diff).
7. **Health panel:** next 7 days coverage, failed sync counts, push delivery failures.

---

## 8. TEAM STRUCTURE (guidance for `/teamwork-preview`)

Antigravity decides the actual roster. Regardless of the number of agents, the following **role responsibilities** must exist and remain separated:

| Role | Rules |
|------|-------|
| **Explorers** (read-only) | Audit prototype, trace call chains, list defects and hidden coupling, evaluate options. Never modify source files. Output: `AUDIT.md`, option memos in DECISIONS.md. |
| **Architect/Planner** | Owns PLAN.md, milestone breakdown, interface contracts between tracks (function signatures, JSON shapes, SQL). Contracts are frozen before Workers start a milestone. |
| **Workers** | Build in **non-overlapping tracks** (Client, Core, Data, Auth, Notify, PWA, Admin, Backend). One owner per file (R11). Each Worker writes unit tests for its own code. |
| **Verifiers (independent)** | Never wrote the code under test. Run the full test matrix (§11), attack edge cases, and sign milestones in VERIFICATION.md with evidence. May reject a milestone. |
| **Red-team/Security reviewer** | Runs the §12 checklist: XSS, RLS bypass, token leakage, admin escalation, CSP. Findings are blocking until fixed. |
| **Integrator** | Merges tracks, resolves conflicts, keeps `main` green, runs the final acceptance in §14. |

**Coordination protocol:** interface contract first → implement behind the contract → contract tests in QA → integrate. Any needed contract change is recorded in DECISIONS.md and announced in TASKS.md before code changes.

---

## 9. MILESTONES & GATES

A milestone is **done** only when its gate passes and a Verifier has signed VERIFICATION.md.

| M | Deliverable | Gate (all must pass) |
|---|-------------|----------------------|
| **M0 Audit** | `AUDIT.md`: inventory of screens/flows, every `localStorage` key, every mock, every bug, a11y and perf baseline, Lighthouse scores, list of prototype behaviours to preserve (screenshots of each view × theme). | Human-visible screenshots exist for all views in all 3 themes; defect list ranked. |
| **M1 Modularize** | Monolith split into modules with **zero visual/behaviour change**; test harness (Vitest + Playwright) running; CI script `npm run verify`. | Pixel-diff against M0 screenshots ≤ 0.1% per view; all prototype flows pass e2e; `npm run verify` green. |
| **M2 Core logic** | `dates.js`, `streak.js`, `merge.js`, state migrations, IDB layer. | Unit coverage ≥ 90% on `core/` and `merge.js`; streak/day-boundary suite passes (§11.1). |
| **M3 Backend** | Migrations, RLS, seed (≥ 30 cards), storage bucket, analytics RPCs on local Supabase. | RLS test suite proves every policy in §6 with allow **and** deny cases; migrations apply from zero and are idempotent. |
| **M4 Data + Sync + Offline** | Adapter, fetch/cache, sync queue, SW, prefetch, seed fallback. | Offline e2e passes (§11.3); kill-network-mid-sync test passes; SW update flow tested. |
| **M5 Auth + Migration** | Google sign-in, guest→account merge, session refresh. | Merge property tests pass; sign-in/out/re-sign-in e2e passes; no data loss in any tested scenario. |
| **M6 Admin** | All 7 modules in §7.7. | Non-admin cannot read/write admin data at the **database** level (test with a raw client, not the UI); full card lifecycle e2e (draft → scheduled → appears for users on date). |
| **M7 Notifications + Premium** | Web Push pipeline, bulk download, entitlement gating. | Push received on a real Android Chrome install (or documented emulator evidence); bulk download resumes after interruption. |
| **M8 Hardening & Release** | Perf, a11y, security, docs, RUNBOOK. | Full §14 acceptance passes. |

Real-backend gate: at M3/M6 the agents must stop and request real Supabase project credentials (R3) — they must not proceed on invented ones.

---

## 10. DEBUGGING PROTOCOL (mandatory for every defect)

1. **Reproduce** deterministically. Record exact steps, environment, data, clock/timezone state. If it can't be reproduced, say so and add instrumentation instead of guessing.
2. **Isolate** by bisection (git bisect, disabling modules, minimal test case).
3. **Hypothesize** — write ≥ 2 candidate root causes; state which observation would falsify each.
4. **Instrument** via the `log` module (levels, no PII), read the evidence, and pick the cause.
5. **Fix the root cause**, not the symptom. No `setTimeout` band-aids, no swallowed errors.
6. **Regression test first:** the test must **fail before** the fix and **pass after** (R14). Capture both outputs.
7. **Blast radius check:** grep for the same pattern elsewhere; fix or log siblings.
8. **Log it** in `docs/DEBUG_LOG.md`: symptom, repro, root cause, fix commit, test name, prevention note.
9. **Three-strikes rule:** three failed fix attempts on the same bug → stop, write up findings, and hand to another agent or escalate (§13). Do not keep thrashing.

### Known-risk checklist (Explorers must check each in M0; Workers must not reintroduce)
- Streak computed from raw timestamps or `sessionStart` vs. device clock (breaks on clock change, midnight, timezone change).
- `Date` parsing of `YYYY-MM-DD` as UTC then displayed in local time (off-by-one-day bug). Use explicit tz helpers.
- `JSON.parse(localStorage...)` without try/catch or schema version → crash on corrupted/old data.
- `localStorage` unavailable/throwing (private mode, quota) — app must degrade to in-memory.
- Service worker serving stale HTML forever (missing versioned caches / no update path).
- Caching opaque or error responses (`status !== 200`) into the cache.
- Images without dimensions → layout shift; images not precached → blank offline card.
- Bangla text: missing font fallback, wrong `line-height`, text clipped by fixed heights, `letter-spacing` breaking conjuncts (never apply letter-spacing to Bangla).
- Theme flash on load (apply theme before first paint via a tiny blocking script or `<meta>`+CSS variable default — CSP-compatible via hash or external file).
- Notification permission prompted on load (must be user-initiated only).
- Duplicate event listeners after view re-render (memory leaks, double actions).
- Reset button wiping data without confirmation, or wiping signed-in data without a warning that it is not on the server.
- Sync queue growing unbounded; retries hammering the backend.
- RLS "works" only because the tester was an admin — always test as anon and as a normal user.

---

## 11. TEST MATRIX (QA track; Verifiers execute)

### 11.1 Unit (Vitest)
- `dayKey()` across: midnight boundary in `Asia/Dhaka`, user in other tz, tz change, leap day, year rollover.
- Streak: gaps, same-day repeats, yesterday-only, future-dated tamper, backfill cap.
- Merge: idempotency, commutativity of union, tombstones, empty/large inputs.
- State migration: every old `version` → current; corrupted JSON → safe default.
- Sync queue: ordering, backoff, dedupe, park-after-N.

### 11.2 Integration
- RLS policy suite: for each table × {anon, user A, user B, editor, admin} × {select, insert, update, delete}: expected allow/deny table asserted.
- Editors cannot change roles; users cannot set `is_premium` or `role` on themselves.

### 11.3 End-to-end (Playwright; mobile viewport 360×740 primary, plus desktop)
- First visit → card visible, no modal, no signup wall (P2).
- Go offline (`context.setOffline(true)`) → reload → app, card, image, Bangla text all render.
- Mark learned offline → go online → server reflects it exactly once.
- Theme switch × 3 persists across reload and offline.
- Guest → Google sign-in (mocked OAuth in tests) → data merged, nothing lost.
- SW update: deploy v2 → "Update ready" appears → no forced reload.
- Admin lifecycle: create card → schedule → (fake clock to that date) → visible to user → analytics counts it.
- Bulk download: interrupt at 50% → resume → completes; quota-exceeded path shows a clear message.
- Clock manipulation: set device clock +3 days → streak does not inflate.

### 11.4 Non-functional budgets
- Lighthouse (mobile, throttled): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, PWA installable.
- First load JS (excluding lazy backend SDK) ≤ 60 KB gzip; LCP ≤ 2.5 s on Slow 4G profile; CLS ≤ 0.05.
- Accessibility: axe-core zero serious/critical issues; full keyboard operation; visible focus; contrast AA in **all three themes**; touch targets ≥ 44 px; `lang="bn"` on Bangla spans; respects `prefers-reduced-motion`.

---

## 12. SECURITY CHECKLIST (Red-team; blocking)
- Strict CSP (no `unsafe-inline`, no `unsafe-eval`); `script-src 'self'` plus the backend origin for `connect-src`.
- XSS probes: `<img onerror>`, `javascript:` URLs, and RTL/Unicode tricks in every admin-editable field render inert.
- RLS bypass attempts via the raw REST endpoint with the anon key: read drafts, write another user's progress, self-promote role, call analytics RPCs as user.
- Storage bucket: non-editors cannot upload; MIME/size enforced server-side, not just client-side.
- OAuth: PKCE, exact redirect URL allow-list, no tokens in URLs or logs.
- Admin: brute-force/rate-limit on auth; admin accounts invite-only; audit log immutable to admins.
- Dependency audit (`npm audit`) with no high/critical unresolved.
- Privacy: no PII in logs or analytics; a plain-language privacy note in Settings; data export and account-delete path for signed-in users.

---

## 13. DECISION PROTOCOL & ESCALATION

**Decide autonomously (record in DECISIONS.md)** for anything reversible, internal, and consistent with §1–§4: naming, internal module boundaries, test structure, choice between two equivalent implementations.

**Stop and ask the human** only when:
1. The prototype file is missing/empty (§2).
2. Real credentials, a real domain, or a paid service is needed (R3).
3. A change would violate a Product Invariant (§1) or a Technical Decision (§4).
4. Three fix attempts failed on the same defect (§10.9).
5. The spec is genuinely ambiguous **and** the wrong choice is costly to reverse.
6. Legal/policy questions (privacy law, content licensing for images/audio, Google OAuth verification).

Escalation format: one paragraph of context, the options considered, the recommended option with reasoning, and what is blocked meanwhile. Never ask open-ended "what should I do?" questions.

**Content note:** agents must not scrape or invent vocabulary content presented as authoritative. Seed cards must be marked `draft: needs human review`, with definitions checked against a reputable dictionary; images must be original, generated, or licence-clear and recorded in a `docs/MEDIA_LICENSES.md`.

---

## 14. DEFINITION OF DONE — FINAL ACCEPTANCE (M8)

The Integrator runs this on a clean clone and records evidence for every line.

1. `npm ci && npm run verify && npm run build` succeeds from zero, with no manual steps beyond `.env`.
2. All unit, integration, e2e, and RLS suites pass; **no skipped or weakened tests**.
3. Every Product Invariant P1–P7 re-verified with screenshots/video.
4. Airplane-mode walkthrough recorded: install → offline reload → learn → bookmark → reconnect → sync.
5. Streak correctness suite passes, including the clock-tamper case.
6. Guest→account migration passes with a non-trivial dataset (≥ 200 progress rows) and produces identical results when run twice.
7. Admin lifecycle works end-to-end; non-admin access is impossible at the DB level.
8. Push reminder delivered on a real device or documented emulator evidence; limitations stated in Settings copy.
9. Performance, accessibility, and security budgets (§11.4, §12) met with reports attached.
10. `docs/RUNBOOK.md` covers: local setup, env vars, deploy steps, how to publish a card, how to roll back, how to rotate keys, how to read the audit log.
11. `docs/DEBUG_LOG.md` is complete; open issues are triaged in BACKLOG.md with severity.
12. Final report lists **what was verified, how, and what was not verified** — including anything that could only be tested against the emulator rather than a live backend.

---

## 15. BACKLOG SEEDS (do NOT build in v1)
bKash/Nagad premium payments · spaced-repetition review · streak freeze · exam-specific tracks · shareable card images · Bangla voice narration · multi-device push dedupe · multi-language UI · Play Store TWA wrapper.

---
*End of spec. When in doubt: keep the daily card simple, keep it working offline, and prove every claim with evidence.*
