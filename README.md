# Medora

**Medicine intelligence, verified price comparison and pharmacy discovery — with clinical safety built into the architecture, not bolted on.**

Medora is a production-quality healthcare web platform. It helps people understand the medicines they are prescribed, compare what those medicines cost across nearby pharmacies, make sense of prescriptions and lab reports, and know when a symptom needs a real clinician rather than a website. It also ships three professional workspaces — for pharmacies, doctors and platform administrators — on top of the same typed data layer.

Medora never diagnoses, never prescribes, and never invents a price, a dose or a stock level. Those are enforced constraints in code, not promises in a footer.

---

## Table of contents

- [Why Medora exists](#why-medora-exists)
- [Feature tour](#feature-tour)
- [Safety model](#safety-model)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Roles and routes](#roles-and-routes)
- [The AI pipeline](#the-ai-pipeline)
- [Agent / MCP integration](#agent--mcp-integration)
- [Design system](#design-system)
- [Scripts](#scripts)
- [Data status](#data-status)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## Why Medora exists

Three problems, one product:

1. **People do not understand their medicines.** Leaflets are written for regulators. Search results are written for advertisers. Medora explains what a medicine is, what it contains, what to watch for — in plain language, with the source of every claim visible.
2. **The same medicine costs wildly different amounts.** Identical composition, different brand, different pharmacy, different price. Medora groups medicines by composition key (ingredient + strength + form) and compares the real listings side by side.
3. **Health tools over-claim.** Most "AI health assistants" happily hand out a diagnosis and a dose. Medora is deliberately built so it cannot — every AI response passes a safety validator before it can render.

## Feature tour

### Patient experience

| Area                   | What it does                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| **Dashboard**          | Today's medicines, adherence, open prescriptions, active safety alerts, order status                      |
| **Medicine search**    | Natural-language search ("blood pressure tablet 5mg") resolved to catalogue records                       |
| **Medicine detail**    | Composition, form, pack size, manufacturer, uses, warnings, side effects, storage, provenance             |
| **Price comparison**   | Composition-equivalent alternatives across pharmacies, with lowest/highest spread and savings estimate    |
| **Pharmacy discovery** | Nearby pharmacies with distance, hours, services, licence ID, ratings; list and map views                 |
| **Pharmacy detail**    | Full profile, stocked listings, contact and directions                                                    |
| **Prescriptions**      | Upload, per-line extraction with confidence scores, mandatory human confirmation before anything is used  |
| **Reminders**          | Schedules derived from confirmed prescription lines, with taken/skipped logging                           |
| **Interactions**       | Duplicate-ingredient and allergy cross-checks against the user's own medicine list                        |
| **Allergy checks**     | Explicit allergy-to-ingredient matching with the basis of each match shown                                |
| **Lab reports**        | Analyte-by-analyte plain-language explanation with reference ranges and an explicit "what this is not"    |
| **Symptom triage**     | Structured intake → routing level (emergency / same-day / routine / self-monitor), never a condition list |
| **AI assistant**       | Conversational medicine intelligence with streaming, sources, confidence, feedback and reporting          |
| **Cart & orders**      | Reservation flow with prescription gating for Rx-only items, order timeline                               |
| **History**            | Everything the account has looked up, compared, uploaded and ordered                                      |
| **Notifications**      | Reminder, price, order, safety and system notices                                                         |
| **Settings**           | Health profile, allergies, conditions, consent toggles, location sharing                                  |
| **Emergency**          | Always-reachable red-flag page with escalation guidance                                                   |

### Professional workspaces

- **Pharmacy** — overview KPIs, inventory with reorder levels and expiry, order queue, prescription verification queue, customers, suppliers, analytics.
- **Doctor** — patient list with AI-assisted summaries, schedule/agenda, prescription review queue and composer, consultation notes, medicine history.
- **Admin** — platform metrics, user and role management, pharmacy licence verification, catalogue provenance auditing, moderation triage, immutable audit log.

### Platform

- Full email/password + Google authentication with email verification and password reset
- Role-based access control backed by a dedicated `user_roles` table (never a column on `profiles`)
- Role switcher for accounts holding multiple roles
- Global command palette (`⌘K`)
- MCP server so AI agents can call Medora's read tools over OAuth

## Safety model

Medora treats its own AI layer as untrusted. Every generated response is re-read by a validator **before** it can reach the UI, and is blocked if it contains:

- a monetary value not sourced from the verified price feed
- a stock or availability claim not sourced from a connected pharmacy feed
- diagnostic language ("you have…", "this is probably…")
- a dose, strength instruction or dosing frequency
- prescribing language ("you should stop taking…")
- a model-authored citation presented as a verified source

On top of that:

- **Red-flag detection** scans user input for emergency terms and escalates immediately, above and outside the normal answer flow.
- **Provenance chips** attach to every fact: catalogue, policy, user input, model or external, each marked verified or not.
- **Confidence** is computed from retrieval match quality — never from model self-report.
- **Demo data is labelled as demo** everywhere it appears; nothing simulated is presented as live.
- **Unavailable capabilities say so honestly** and explain what a connected live provider would have done, instead of improvising.

## Tech stack

- **TanStack Start v1** (full-stack React 19, SSR + server functions)
- **TanStack Router** file-based routing, **TanStack Query** for server state
- **TypeScript** end to end, strict
- **Tailwind CSS v4** via `src/styles.css` with oklch design tokens
- **shadcn/ui** + Radix primitives
- **Recharts** for workspace analytics
- **Supabase** (Lovable Cloud) for auth, profiles and roles
- **Vitest** + Testing Library + jsdom
- **ESLint** (incl. a custom project rule) + Prettier
- **MCP** via `@lovable.dev/mcp-js`

## Getting started

```sh
git clone <this-repository-url>
cd medora
npm i
npm run dev
```

The app runs at `http://localhost:8080`.

Environment variables are managed by the platform and live in `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

The publishable key is safe to expose. There are no other required secrets — the AI layer runs on the built-in demo provider until a live provider is registered.

## Project structure

```
src/
  ai/                 AI architecture: schemas, intent, pipeline, safety, providers
  components/
    ai/               Confidence, provenance and payload rendering
    auth/             Role guards and header session actions
    common/           Error boundary and shared primitives
    layout/           Patient shell, workspace shell, command palette, nav config
    medicine/         Medicine cards
    ui/               shadcn/ui components
    workspace/        DataTable, charts, workspace parts
  data/               Typed demo datasets (catalogue + workspace)
  integrations/       Supabase clients, Lovable integration
  lib/                Domain models, auth context, global store, MCP tools, utils
  routes/             File-based routes (see below)
  services/           Provider boundary, medicines, clinical, workspace loaders
  styles.css          Design tokens and utilities
  test/               Vitest setup and tests
eslint-rules/         Custom lint rule: no useStore outside AppStoreProvider
scripts/              Static reachability check for store provider mounting
```

## Roles and routes

| Prefix                                         | Role                | Guard         |
| ---------------------------------------------- | ------------------- | ------------- |
| `/` , `/emergency`, `/auth`, `/reset-password` | public              | none          |
| `/app/*`                                       | patient (or admin)  | `RequireRole` |
| `/pharmacy/*`                                  | pharmacy (or admin) | `RequireRole` |
| `/doctor/*`                                    | doctor (or admin)   | `RequireRole` |
| `/admin/*`                                     | admin               | `RequireRole` |
| `/switch`                                      | any signed-in role  | session       |
| `/mcp`, `/.mcp/*`, `/.well-known/*`            | agents              | OAuth         |

Every guarded group is wrapped in `AppRouteGroup`, which guarantees the global store provider and error boundary are mounted before any child renders.

## The AI & Multi-Agent XAI Pipeline

Medora features a **Multi-Agent Explainable AI (XAI) Architecture** grounded in Clinical RAG (Retrieval-Augmented Generation) and powered by **Google Gemini** (with deterministic fallback).

```
User Input / Medicine Query
  │
  ├── 1. Intent Detection ─── Classify clinical query & extract entities (APIs, dosages, symptoms)
  │
  ├── 2. Multi-Agent XAI Network (Collaborative Specialized Agents)
  │     ├── 🔬 PharmAI Agent   ── Evaluates bioequivalence, molecular composition, and CDSCO status
  │     ├── 🛡️ Aegis Safety     ── Runs multi-drug CYP450 interactions, allergies & organ precautions
  │     ├── 📈 EconRx Agent     ── Computes unit price arbitrage, generic alternatives & cost spreads
  │     └── 🩺 TriageAI Agent   ── Clinical decision support, symptom triage & red-flag detection
  │
  ├── 3. Clinical RAG Engine ─ Context grounding against Indian Pharmacopoeia & CDSCO monographs
  ├── 4. Live Model Routing  ─ Google Gemini 3.7 Flash with verified temperature & token controls
  ├── 5. Safety Validation   ─ Blocks unverified pricing claims, doses, and speculative diagnoses
  └── 6. Response Composition─ Typed schema payload + confidence calibration + provenance sources
```

### The 4 Autonomous Clinical Agents

1. **🔬 PharmAI Agent (Clinical Pharmacology & Bioequivalence)**
   - Deconstructs pharmaceutical formulations into active pharmaceutical ingredients (APIs).
   - Verifies bioequivalence across branded vs generic alternatives using CDSCO and IP therapeutic monographs.

2. **🛡️ Aegis Safety Agent (Drug-Drug & Food Interactions)**
   - Evaluates multi-drug regimens against CYP450 enzyme metabolism and receptor binding interaction matrices.
   - Flags black box warnings, pregnancy/lactation contraindications, and hepatic/renal dosage precautions.

3. **📈 EconRx Agent (Unit Price Arbitrage & Fair Economics)**
   - Normalizes pricing across disparate pack sizes and strengths to compute true per-unit therapy costs.
   - Calculates exact patient savings when substituting high-cost branded drugs with verified bioequivalent generics.

4. **🩺 TriageAI Agent (Clinical Decision Support & Safe Routing)**
   - Maps symptoms to appropriate care escalation tiers (`emergency`, `same_day`, `routine`, `self_monitor`).
   - Automatically intercepts red-flag emergencies (chest pain, anaphylaxis, stroke symptoms) with immediate hospital guidance.

### Google Gemini & Clinical RAG Setup

Medora connects directly to **Google Gemini** via verified REST endpoints (`gemini-3.7-flash` with automatic cascade to `gemini-3.6-flash` / `gemini-3.5-flash`).

Configure your Gemini API key in `.env`:

```env
VITE_GEMINI_API_KEY=AIzaSy...YourKeyHere
```

_Alternatively, users and clinicians can manage and test their Gemini API Key directly inside the web interface on the Medicine Assistant screen via the **🔑 Connect Gemini API Key** modal._

---

## Agent / MCP integration

Medora exposes an MCP server with OAuth-protected read tools:

- `search_medicines` — natural-language and structured medicine search
- `get_medicine` — full record for one medicine including provenance
- `compare_prices` — composition-equivalent listings across pharmacies
- `find_pharmacies` — nearby pharmacies with services and hours

All tools are read-only. No agent-callable tool can place an order, alter a prescription or change a role.

## Design system

All colour, radius, shadow and spacing values are semantic tokens in `src/styles.css` — components never hardcode colour utilities.

- Background: warm off-white `oklch(0.981 0.006 85)`
- Foreground: deep navy `oklch(0.245 0.032 254)`
- Accent: clinical teal
- Type: Manrope for headings, Inter for body
- Restrained radii, no gradients, no glassmorphism, no decorative sparkle iconography

The visual target is a calm, printed-clinical feel — dense where information matters, generous where reading matters.

## Scripts

| Command               | What it does                                                   |
| --------------------- | -------------------------------------------------------------- |
| `npm run dev`         | Dev server on :8080                                            |
| `npm run build`       | Production build                                               |
| `npm run preview`     | Preview the production build                                   |
| `npm run lint`        | ESLint across the repo                                         |
| `npm run format`      | Prettier write                                                 |
| `npm run test`        | Vitest run                                                     |
| `npm run test:watch`  | Vitest watch                                                   |
| `npm run check:store` | Static check that every `useStore` caller is inside a provider |

## Data status

The catalogue, pharmacy, price, inventory, order, appointment, moderation and audit datasets are **typed demo data**, clearly labelled as such in the UI. Auth, profiles and roles are **live** (Supabase). Every read goes through `src/services/*`, which simulates provider latency — so swapping in a live regulator catalogue, pharmacy price feed or OCR provider is a change to those function bodies and nothing else.

## Documentation

- [`PROJECT.md`](./PROJECT.md) — what is implemented, what is partial, what is missing, and the roadmap
- [`DESCRIPTION.md`](./DESCRIPTION.md) — the full technical documentation

## Contributing

1. Run `npm run lint`, `npm run test` and `npm run check:store` before opening a PR.
2. Never hardcode colour utilities — use design tokens.
3. Any new AI capability must return a typed payload and pass through the safety validator.
4. Any new `public` table needs GRANTs, RLS and policies in the same migration.
5. Roles live in `user_roles`. Never on a profile row.

## Disclaimer

Medora provides health **information**, not medical advice. It is not a doctor, pharmacist or prescriber. It does not diagnose and it never tells anyone to start, stop or change a medicine. In an emergency, contact your local emergency number.
