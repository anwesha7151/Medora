# Medora — Project Status

A running record of what is built, what is partially built, what is missing, and what comes next.

Last updated: 19 August 2026

---

## 1. Status at a glance

| Layer                              | Status                           |
| ---------------------------------- | -------------------------------- |
| Design system & tokens             | Complete                         |
| Domain models & typed data layer   | Complete                         |
| Public marketing site              | Complete                         |
| Authentication & role-based access | Complete                         |
| Patient experience (20 areas)      | Complete                         |
| AI architecture & safety pipeline  | Complete (demo provider)         |
| Doctor workspace                   | Complete                         |
| Pharmacy workspace                 | Complete                         |
| Admin workspace                    | Complete                         |
| MCP / agent integration            | Complete (read-only tools)       |
| Testing                            | Minimal — one integration test   |
| Live data providers                | Not started — demo adapters only |
| Payments / real ordering           | Not started                      |
| Accessibility & mobile audit       | Partial                          |

---

## 2. Implemented

### 2.1 Foundations

- **Design system** (`src/styles.css`) — oklch semantic tokens, warm off-white surface, deep navy foreground, clinical teal accent, Manrope/Inter typography, surface utilities. No hardcoded colours anywhere in components.
- **Domain models** (`src/lib/domain.ts`) — `Medicine`, `ActiveIngredient`, `PriceListing`, `Pharmacy`, `Prescription`, `PrescriptionItem`, `Reminder`, `ComparisonRecord`, `Order`, `OrderItem`, `OrderStatus`, `LabReport`, `LabValue`, `HealthProfile`, `AppRole`, `NotificationItem`, `InventoryItem`, `DoctorPatient`, `AuditEvent`, and a `Provenance` interface attached to every sourced record.
- **Provider boundary** (`src/services/provider.ts`) — every read goes through a `settle()` helper that simulates provider latency, which is what drives real loading states rather than fake skeletons.
- **Global store** (`src/lib/store.tsx`) — persisted client state for profile, cart, reminders, history, notifications.
- **Route group wrapper** (`src/components/layout/AppRouteGroup.tsx`) — guarantees `AppStoreProvider` + error boundary for `/app`, `/switch`, `/pharmacy`, `/doctor`, `/admin`.
- **Error boundary** (`src/components/common/AppErrorBoundary.tsx`) — safe fallback screen with a Reload action.
- **Custom lint rule** (`eslint-rules/no-usestore-outside-provider.js`) plus a static reachability script (`scripts/check-store-provider.mjs`, `npm run check:store`).

### 2.2 Authentication & roles

- Supabase-backed `profiles` and `user_roles` tables, with a `has_role()` security-definer function and RLS policies.
- Roles are stored in a **separate table** — never as a column on a profile — to prevent privilege escalation.
- `src/lib/auth.tsx` — `AuthProvider` / `useAuth` with sign-in, sign-up (role selection), sign-out, password reset and `resendVerification`.
- `src/routes/auth.tsx` — unified auth page: sign in, sign up, forgot password, and a post-signup **email verification step** with a 45-second resend cooldown.
- `src/routes/reset-password.tsx` — password reset completion.
- Google OAuth configured as a provider.
- `src/components/auth/RequireRole.tsx` — route guard with a clean "wrong role" screen, redirect-loop protection via a navigation ref, and sanitised `next` targets.
- `src/routes/switch.tsx` — workspace switcher for multi-role accounts.
- `src/components/auth/AuthHeaderAction.tsx` — session-aware landing header ("Sign in" vs "Open workspace").
- Sign-out clears cached query data (`src/lib/use-sign-out.ts`).

### 2.3 Patient experience — all 20 areas

1. **Landing** (`index.tsx`) — editorial hero, problem framing, capability sections, honest data-status note.
2. **Dashboard** (`app.index.tsx`) — today's medicines, adherence, safety alerts, open prescriptions, order status, profile-aware greeting.
3. **Search** (`app.search.tsx`) — natural-language query interpretation into ingredient/strength/form/supply, plus filters.
4. **Medicine detail** (`app.medicine.$medicineId.tsx`) — composition, uses, warnings, side effects, storage, manufacturer, provenance panel.
5. **Price comparison** (`app.compare.tsx`) — composition-key equivalence grouping, lowest/highest spread, savings estimate, per-pharmacy listings.
6. **Pharmacy list** (`app.pharmacies.index.tsx`) — distance, hours, 24h flag, services, licence ID, rating; list/map toggle.
7. **Pharmacy detail** (`app.pharmacies.$pharmacyId.tsx`) — profile, listings, contact.
8. **Prescriptions** (`app.prescriptions.tsx`) — upload, simulated OCR extraction with per-line confidence, mandatory user confirmation before any line is actionable.
9. **Reminders** (`app.reminders.tsx`) — schedules from confirmed lines, taken/skipped log.
10. **Interactions** (`app.interactions.tsx`) — duplicate-ingredient detection and allergy cross-check with the basis shown.
11. **Lab reports** (`app.labs.tsx`) — analyte table with reference ranges, flags and plain-language explanation plus an explicit "what this is not".
12. **Symptom triage** (`app.triage.tsx`) — structured intake (symptoms, duration, severity, age band, pregnancy, current medicines, allergies, red flags) → routing level and monitoring plan, never a condition list.
13. **AI assistant** (`app.assistant.tsx`) — streaming conversational UI, suggested prompts, typed answer cards, source chips, confidence, escalation, feedback and report, clear conversation, persisted history.
14. **Cart** (`app.cart.tsx`) — reservation flow with Rx gating.
15. **Orders** (`app.orders.tsx`) — status timeline across the full lifecycle.
16. **Verification** (`app.verify.tsx`) — prescription verification status.
17. **History** (`app.history.tsx`) — searches, comparisons, uploads, orders.
18. **Notifications** (`app.notifications.tsx`) — reminder / price / order / safety / system.
19. **Settings** (`app.settings.tsx`) — profile, allergies, conditions, consent toggles, location sharing.
20. **Emergency** (`emergency.tsx`) — red-flag signs and escalation, reachable from anywhere.

Plus a global **command palette** (`⌘K`) and the `PatientShell` responsive navigation.

### 2.4 AI architecture

| File                          | Role                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/ai/schemas.ts`           | Typed payloads, `AiEnvelope`, confidence, sources, safety verdict, pipeline trace               |
| `src/ai/intent.ts`            | Stage 1 intent detection + Stage 2 entity extraction                                            |
| `src/ai/provider-types.ts`    | The `MedoraAiProvider` adapter contract                                                         |
| `src/ai/providers/demo.ts`    | Demo adapter — honest provenance, declares its own capabilities                                 |
| `src/ai/registry.ts`          | Provider registration and capability lookup                                                     |
| `src/ai/pipeline.ts`          | Six-stage orchestration with per-stage timing                                                   |
| `src/ai/safety.ts`            | Stage 6 validator: prices, stock, diagnosis, dosing, prescribing, fabricated sources, red flags |
| `src/ai/render.ts`            | Payload → renderable mapping                                                                    |
| `src/ai/useAiConversation.ts` | Conversation state machine: streaming, typing, retry, error, feedback, clear, persistence       |
| `src/components/ai/*`         | Confidence badge, provenance chips, payload views                                               |

Capabilities defined: medicine intelligence, prescription OCR, symptom triage, medicine explanation, drug interaction, allergy check, lab explanation, medicine comparison, patient summary, natural-language search. Any capability the active provider does not declare returns an honest "unavailable" notice explaining what a live provider would do.

### 2.5 Professional workspaces

- **Shell** — `WorkspaceShell.tsx` with role-based navigation (`nav-config.ts`), profile display, sign-out.
- **Primitives** — `DataTable.tsx` (sortable, filterable, empty/loading/error states), `charts.tsx` (Recharts wrapped in Medora tokens), `parts.tsx` (`StatTile`, `WorkspaceSection`, `Timeline`, `AiAssistNotice`, `AiAssistTag`).
- **Data** — `src/data/workspace-demo.ts` + `src/services/workspace.ts` (TanStack Query with retry, staleTime, typed resource keys).
- **Doctor** — overview with AI-assisted patient summaries and audit trail; schedule/agenda; prescription review queue and composer.
- **Pharmacy** — overview KPIs and charts; inventory with stock status, reorder levels and expiry; order queue with detail dialogs; prescription verification queue; customers; suppliers; analytics.
- **Admin** — platform metrics; user and role management; pharmacy licence verification; catalogue provenance auditing; moderation triage; immutable audit log.

### 2.6 Agent / MCP

- `src/lib/mcp/` with four read-only tools: `search-medicines`, `get-medicine`, `compare-prices`, `find-pharmacies`.
- OAuth consent route and protected-resource metadata route.
- No write-capable tool is exposed to agents.

### 2.7 Quality work already done

- 740+ lint errors fixed; lint is error-free apart from benign shadcn fast-refresh warnings.
- Typecheck clean across the whole app.
- All 32 routes walked signed in as patient, pharmacy, clinician and admin — no console errors, no broken links, no route failures.
- AI-cliché purge: no sparkle/wand iconography, no gradients, no glassmorphism, no oversized radii, no fake testimonials or invented statistics.
- Hydration bugs fixed in the dashboard and the AI conversation hook.
- Redirect loop in `RequireRole` fixed.
- Store-provider guarantee enforced by lint rule, static script and an integration test.

---

## 3. Partially implemented

| Item                    | What exists                                                                                                       | What is missing                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Testing**             | One integration test (`src/test/root-store.test.tsx`) proving the store provider is reachable from `PatientShell` | Unit tests for the safety validator, pipeline stages, intent detection, composition-key equivalence; component tests for `DataTable` and forms; no E2E suite     |
| **Accessibility**       | Semantic HTML, Radix primitives (so focus management and ARIA come mostly free), visible focus states             | No full keyboard-navigation pass, no screen-reader audit, no contrast audit against WCAG AA on every token pairing, no skip-to-content link                      |
| **Mobile / responsive** | Shells and most pages are responsive; tables scroll horizontally                                                  | No systematic breakpoint audit; dense workspace tables are cramped on small screens; the landing hero headline still wraps awkwardly and leaves an orphaned word |
| **Prescription OCR**    | Full extraction UI with per-line confidence and mandatory confirmation                                            | The extraction itself is simulated — no real OCR service is connected                                                                                            |
| **Map view**            | List/map toggle on pharmacy discovery                                                                             | The map is a static representation, not an interactive tiles-based map                                                                                           |
| **Notifications**       | In-app notification centre with typed kinds                                                                       | No push, no email, no scheduled delivery — reminders do not actually fire                                                                                        |
| **Orders**              | Full status model and timeline UI                                                                                 | Nothing is transmitted to a pharmacy; status transitions are local                                                                                               |
| **Analytics charts**    | Recharts views over demo aggregates                                                                               | No real time-series store, no date-range selection on every chart                                                                                                |

---

## 4. Not implemented / missing

### 4.1 Live data

- **No live medicine catalogue.** The dataset is typed demo data from `src/data/demo-catalog.ts`. A regulator or licensed drug database needs to be wired into `src/services/medicines.ts`.
- **No live price feed.** Prices are demo listings. Real listings require pharmacy partner integrations.
- **No live inventory.** Stock levels are demo. The UI already refuses to present them as live.
- **No live interaction database.** Interaction checking is limited to duplicate active ingredients and declared allergies — it does not cover pharmacodynamic or pharmacokinetic interactions, which requires a licensed clinical database.
- **No live LLM provider.** The AI layer runs the demo adapter. The adapter contract exists specifically so a real model can be dropped in.

### 4.2 Product features

- Payments and checkout (no provider enabled)
- Real pharmacy-side order acceptance and fulfilment messaging
- Delivery tracking
- Insurance / reimbursement handling
- Multi-language and localisation (English only; currency fixed to USD formatting)
- Family / dependant profiles under one account
- Refill prediction and automatic reorder
- Doctor–patient messaging
- Teleconsultation
- Document vault for historical reports
- Data export / account deletion self-service (GDPR-style rights)
- Two-factor authentication
- Audit-log export for administrators

### 4.3 Engineering & operations

- No CI pipeline (lint / typecheck / test on PR)
- No error monitoring service wired to production
- No performance budget, bundle analysis or route-level code-splitting review
- No rate limiting on the MCP endpoints
- No seeded staging environment separate from demo data
- No formal migration history documentation
- No structured logging or request tracing on server functions
- Security scan and dependency scan not yet run as a recurring step

### 4.4 Compliance

Medora is currently an **informational product**. It has not been assessed against:

- HIPAA / GDPR / DPDP formal compliance programmes
- Medical device software classification (it is deliberately positioned outside it — no diagnosis, no dosing)
- Pharmacy licensing requirements in any specific jurisdiction
- Clinical content review by a qualified pharmacist or physician

**Any real deployment must complete a clinical content review and a jurisdiction-specific regulatory assessment before going live.**

---

## 5. Known issues

1. Landing hero headline wraps awkwardly at some viewport widths, leaving an orphaned word.
2. Workspace data tables are dense on narrow screens; horizontal scroll works but is not ideal.
3. Six ESLint warnings remain, all `react-refresh/only-export-components` on shadcn/ui files — benign.
4. Reminder scheduling has no delivery mechanism, so a reminder never actually alerts the user outside the app.
5. `daysUntil` in `src/services/workspace.ts` is pinned to a fixed reference date for stable demo output — must become `Date.now()` when live data arrives.

---

## 6. Roadmap

### Next (hardening)

- Unit tests for `safety.ts`, `pipeline.ts`, `intent.ts` and composition-key equivalence
- Full keyboard-navigation and screen-reader pass
- Responsive audit of every workspace table
- Fix the hero wrapping issue
- CI: lint + typecheck + test + `check:store` on every PR

### Then (live data)

- Register a live medicine catalogue adapter
- Register a real OCR provider behind `extractPrescription`
- Register a licensed interaction database behind `checkInteractions`
- Register a live LLM provider behind `MedoraAiProvider`, with the safety validator unchanged and still authoritative

### Later (product)

- Pharmacy partner API for real listings, stock and order acceptance
- Payments and fulfilment
- Notification delivery (push + email) so reminders actually fire
- Family profiles, refill prediction, document vault
- Localisation

---

## 7. How to extend Medora

**Add an AI capability**

1. Add the payload type and capability name in `src/ai/schemas.ts`.
2. Implement the method on `MedoraAiProvider` in `src/ai/provider-types.ts`.
3. Implement it in the demo adapter (or a new adapter) and register it.
4. Add a renderer in `src/components/ai/AiPayloadView.tsx`.
5. Confirm the safety validator covers whatever new claims the payload can carry.

**Add a live data provider**
Change the function bodies in `src/services/*` only. Routes and components read through those loaders and should not need edits.

**Add a workspace page**
Add the resource to `src/services/workspace.ts`, add the route file, use `WorkspaceShell` + `DataTable`/`StatTile`/charts, and register it in `src/components/layout/nav-config.ts`.

**Add a table**
`CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`, in that order, in the same migration.
