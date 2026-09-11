# Medora — Full Technical Documentation

Complete reference documentation for the Medora healthcare platform: purpose, architecture, data model, AI pipeline, safety system, routing, authentication, design system, integrations, operations and glossary.

Last updated: 19 August 2026

---

## Table of contents

1. [Overview](#1-overview)
2. [Product principles](#2-product-principles)
3. [Architecture](#3-architecture)
4. [Technology stack](#4-technology-stack)
5. [Repository layout](#5-repository-layout)
6. [Domain model](#6-domain-model)
7. [Data layer and provider boundary](#7-data-layer-and-provider-boundary)
8. [Routing](#8-routing)
9. [Authentication and authorisation](#9-authentication-and-authorisation)
10. [State management](#10-state-management)
11. [The AI/ML experience layer](#11-the-aiml-experience-layer)
12. [Clinical safety system](#12-clinical-safety-system)
13. [Patient experience — page by page](#13-patient-experience--page-by-page)
14. [Professional workspaces](#14-professional-workspaces)
15. [Design system](#15-design-system)
16. [Component library](#16-component-library)
17. [MCP / agent integration](#17-mcp--agent-integration)
18. [Error handling and resilience](#18-error-handling-and-resilience)
19. [Testing and quality gates](#19-testing-and-quality-gates)
20. [Performance](#20-performance)
21. [Accessibility](#21-accessibility)
22. [SEO and metadata](#22-seo-and-metadata)
23. [Security posture](#23-security-posture)
24. [Deployment and operations](#24-deployment-and-operations)
25. [Extension guides](#25-extension-guides)
26. [Conventions](#26-conventions)
27. [Glossary](#27-glossary)

---

## 1. Overview

Medora is a full-stack web platform for medicine intelligence and pharmacy access. It serves four distinct audiences from one codebase and one typed data layer:

- **Patients** — understand a medicine, compare its price, find where to get it, make sense of a prescription or lab report, and know when to see a clinician.
- **Pharmacies** — manage inventory, orders, prescription verification, customers, suppliers and analytics.
- **Doctors** — review patients with AI-assisted summaries, manage a schedule, and review or compose prescriptions.
- **Administrators** — govern users and roles, verify pharmacy licences, audit catalogue provenance, triage moderation reports and read an immutable audit log.

The defining constraint is that Medora is **informational, not clinical**. It does not diagnose, does not prescribe, and never fabricates a price, a dose or a stock level. This is enforced by an architectural safety validator, not by copy.

### Deployment surfaces

- Preview: `https://id-preview--1aed4779-46f0-49b4-84a8-f14c261ef63b.lovable.app`
- Production: `https://medora-health-guide.lovable.app`

---

## 2. Product principles

**1. Provenance or silence.** Every displayed fact carries a source. If Medora cannot say where something came from, it does not display it.

**2. The AI layer is untrusted.** Model output is validated before render, by rules that assume the model will eventually try to produce something unsafe.

**3. Simulated is labelled simulated.** Demo data is never dressed up as live. The `simulated` flag rides in every AI envelope and the `Provenance.verified` boolean rides on every record.

**4. Honest unavailability beats a plausible guess.** A capability the active provider does not support returns an explicit "unavailable" notice that says what a live provider would have done.

**5. Routing, not diagnosis.** Triage produces an escalation level and a monitoring plan. It never produces a condition list.

**6. The interface is a clinical document, not a marketing page.** Dense where information matters, generous where reading matters. No gradients, no glassmorphism, no decorative iconography, no invented statistics.

---

## 3. Architecture

```
┌───────────────────────────────────────────────────────────┐
│ Browser (React 19)                                        │
│  routes/  components/  design tokens                      │
│      │                                                    │
│      ├── AppRouteGroup   (store provider + error boundary)│
│      ├── AuthProvider    (session, profile, roles)        │
│      ├── RequireRole     (per-group role guard)           │
│      └── TanStack Query  (server state, retry, staleTime) │
└───────────────┬───────────────────────────────┬───────────┘
                │                               │
        services/ boundary                 ai/ pipeline
        (settle + latency)          (6 stages + safety gate)
                │                               │
     ┌──────────┴─────────┐        ┌────────────┴───────────┐
     │ demo datasets      │        │ MedoraAiProvider        │
     │ (swap for live)    │        │ registry → demo adapter │
     └────────────────────┘        └─────────────────────────┘
                │
        Supabase (Lovable Cloud)
        auth · profiles · user_roles
                │
        MCP server (OAuth, read-only tools)
```

Three deliberate seams make the product replaceable without UI churn:

1. **`src/services/*`** — the only place data is fetched. Swapping demo data for a live API changes function bodies only.
2. **`MedoraAiProvider`** — the only contract an AI backend must satisfy. Adding a real LLM changes no component.
3. **`src/ai/safety.ts`** — sits between any provider and the UI, so a new provider inherits every safety guarantee automatically.

---

## 4. Technology stack

| Concern      | Choice                           | Notes                                            |
| ------------ | -------------------------------- | ------------------------------------------------ |
| Framework    | TanStack Start v1                | SSR + server functions, Vite 8 build             |
| Routing      | TanStack Router (file-based)     | `src/routes`, generated `routeTree.gen.ts`       |
| UI           | React 19                         | Concurrent rendering, no legacy entry files      |
| Server state | TanStack Query v5                | retry, staleTime, typed keys                     |
| Styling      | Tailwind CSS v4                  | tokens in `src/styles.css`, no config file flow  |
| Components   | shadcn/ui + Radix                | 40+ primitives in `src/components/ui`            |
| Charts       | Recharts                         | wrapped in `src/components/workspace/charts.tsx` |
| Forms        | react-hook-form + zod            | `@hookform/resolvers`                            |
| Auth/DB      | Supabase (Lovable Cloud)         | `profiles`, `user_roles`, RLS                    |
| Icons        | lucide-react                     | functional icons only                            |
| Toasts       | sonner                           | mounted once in `__root.tsx`                     |
| Tests        | Vitest + Testing Library + jsdom | `vitest.config.ts`                               |
| Lint         | ESLint 9 flat config + Prettier  | plus a custom project rule                       |
| Agents       | `@lovable.dev/mcp-js`            | OAuth-protected MCP server                       |
| Language     | TypeScript 5.8, strict           | `tsgo` for typechecks                            |

---

## 5. Repository layout

```
.
├── AGENTS.md                         Agent-facing repo notes
├── README.md                         Public overview
├── PROJECT.md                        Implementation status & roadmap
├── DESCRIPTION.md                    This document
├── components.json                   shadcn config
├── eslint.config.js                  Flat ESLint config
├── eslint-rules/
│   └── no-usestore-outside-provider.js
├── scripts/
│   └── check-store-provider.mjs      Static provider-reachability check
├── supabase/config.toml              Generated; do not edit
├── vite.config.ts  vitest.config.ts  tsconfig.json
├── public/robots.txt
└── src/
    ├── ai/
    │   ├── intent.ts                 Stages 1–2
    │   ├── pipeline.ts               Orchestration
    │   ├── provider-types.ts         Adapter contract
    │   ├── providers/demo.ts         Demo adapter
    │   ├── registry.ts               Provider registry
    │   ├── render.ts                 Payload → view mapping
    │   ├── safety.ts                 Stage 5/6 validator
    │   ├── schemas.ts                All AI types
    │   └── useAiConversation.ts      Chat state machine
    ├── components/
    │   ├── ai/                       AiPayloadView, ai-parts
    │   ├── auth/                     RequireRole, AuthHeaderAction
    │   ├── common/                   AppErrorBoundary, primitives
    │   ├── layout/                   PatientShell, WorkspaceShell,
    │   │                             AppRouteGroup, CommandPalette, nav-config
    │   ├── medicine/                 MedicineCard
    │   ├── ui/                       shadcn/ui
    │   └── workspace/                DataTable, charts, parts
    ├── data/
    │   ├── demo-catalog.ts           Medicines, pharmacies, prices, inventory…
    │   └── workspace-demo.ts         Workspace datasets
    ├── integrations/
    │   ├── lovable/
    │   └── supabase/                 Generated clients & middleware
    ├── lib/
    │   ├── auth.tsx                  AuthProvider / useAuth
    │   ├── domain.ts                 Domain types
    │   ├── store.tsx                 Global client store
    │   ├── mcp/                      MCP server + tools
    │   ├── use-sign-out.ts  utils.ts
    │   └── error-capture.ts  error-page.ts  lovable-error-reporting.ts
    ├── routes/                       See §8
    ├── services/
    │   ├── provider.ts               settle() latency boundary
    │   ├── medicines.ts              Catalogue reads
    │   ├── clinical.ts               Triage & interaction logic
    │   └── workspace.ts              Workspace loaders + formatters
    ├── styles.css                    Design tokens
    ├── test/                         setup.ts, root-store.test.tsx
    ├── router.tsx  server.ts  start.ts
    └── routeTree.gen.ts              Generated; never edit
```

---

## 6. Domain model

Defined in `src/lib/domain.ts`. Provider-agnostic by design — demo and live adapters both resolve to these shapes.

### 6.1 Provenance

```ts
interface Provenance {
  source: string; // regulator, catalogue, pharmacy feed…
  updatedAt: string; // ISO date the source last reviewed it
  verified: boolean; // true only for connected live providers
  note?: string;
}
```

Attached to `Medicine`, `PriceListing` and `Pharmacy`. Rendered as provenance UI throughout. `verified: false` is what makes demo data visibly demo.

### 6.2 Core entities

| Type                     | Key fields                                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Medicine`               | `brandName`, `genericName`, `activeIngredients[]`, `form`, `packSize`, `manufacturer`, `prescriptionOnly`, `usesSummary`, `commonSideEffects[]`, `warnings[]`, `storage`, `provenance`, `compositionKey` |
| `ActiveIngredient`       | `name`, `strength`                                                                                                                                                                                       |
| `PriceListing`           | `medicineId`, `pharmacyId`, `price`, `currency`, `packSize`, `availability`, `updatedAt`, `provenance`                                                                                                   |
| `Pharmacy`               | `name`, `address`, `city`, `distanceKm`, `rating`, `reviews`, `opensAt`, `closesAt`, `open24h`, `phone`, `services[]`, `licenseId`, `coords`, `provenance`                                               |
| `Prescription`           | `fileName`, `uploadedAt`, `prescriberName`, `status`, `items[]`, `patientName?`, `reviewNote?`                                                                                                           |
| `PrescriptionItem`       | `medicineText`, `strength`, `frequency`, `duration`, `notes?`, `confidence`, `userConfirmed`                                                                                                             |
| `Reminder`               | `medicineName`, `strength`, `times[]`, `startDate`, `endDate`, `instruction`, `sourcePrescriptionId?`, `active`, `log[]`                                                                                 |
| `Order`                  | `pharmacyId`, `pharmacyName`, `placedAt`, `items[]`, `total`, `fulfilment`, `prescriptionId?`, `status`, `timeline[]`                                                                                    |
| `LabReport` / `LabValue` | `panel`, `values[]` with `referenceRange`, `flag`, `explanation`                                                                                                                                         |
| `HealthProfile`          | demographics, `allergies[]`, `conditions[]`, `currentMedicines[]`, `pregnancyStatus`, consent flags                                                                                                      |
| `InventoryItem`          | `batch`, `stock`, `reorderLevel`, `price`, `expiry`, `supplier`                                                                                                                                          |
| `DoctorPatient`          | `reason`, `lastVisit`, `status`, `allergies[]`, `currentMedicines[]`, `aiSummary`                                                                                                                        |
| `AuditEvent`             | `at`, `actor`, `action`, `target`, `ip`                                                                                                                                                                  |
| `NotificationItem`       | `title`, `body`, `at`, `kind`, `read`                                                                                                                                                                    |

### 6.3 Composition key

`compositionKey = activeIngredient + strength + form`.

This single field powers price comparison. Two products with the same composition key are treated as interchangeable **for the purpose of showing alternatives** — the UI always states that substitution is a decision for a pharmacist or prescriber, never Medora's.

### 6.4 Enumerations

- `DosageForm`: Tablet | Capsule | Syrup | Suspension | Injection | Cream | Drops | Inhaler
- `OrderStatus`: awaiting_prescription | verifying | accepted | preparing | ready | completed | cancelled
- `AppRole`: patient | pharmacy | doctor | admin
- `PriceListing.availability`: in_stock | low_stock | out_of_stock
- `Prescription.status`: extracted | reviewed | verified | rejected

---

## 7. Data layer and provider boundary

### 7.1 `settle()`

Every read passes through `settle(value, ms)` in `src/services/provider.ts`, which resolves after a realistic delay. This is not decoration: it is what forces the UI to have genuine loading states rather than instantly-resolved data that hides missing skeletons.

### 7.2 Service modules

| Module         | Responsibility                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `medicines.ts` | Catalogue search, medicine lookup, listings, equivalence grouping                                                  |
| `clinical.ts`  | Triage logic, duplicate-ingredient and allergy cross-checks                                                        |
| `workspace.ts` | All professional-workspace loaders + `money` / `shortDate` / `shortDateTime` / `timeOnly` / `daysUntil` formatters |

### 7.3 `useWorkspaceData`

```ts
const { data, isLoading, error, refetch } = useWorkspaceData("inventory");
```

A single typed entry point over `workspaceLoaders`, with `staleTime: 30_000` and `retry: 1`. Resource keys are literal-typed, so a typo is a compile error and the return type is inferred per resource.

### 7.4 Swapping to live data

Replace the body of a loader. Nothing else moves:

```ts
// before
inventory: () => settle(demoInventory, 420),
// after
inventory: () => fetch("/api/inventory").then(r => r.json()),
```

Set `Provenance.verified = true` only when the record genuinely came from a connected provider — the UI reads that boolean to decide whether to label something as demo.

---

## 8. Routing

File-based under `src/routes`. Never edit `src/routeTree.gen.ts`.

### 8.1 Public

| Route             | Page                                |
| ----------------- | ----------------------------------- |
| `/`               | Landing                             |
| `/emergency`      | Emergency red-flag signs            |
| `/auth`           | Sign in / sign up / forgot / verify |
| `/reset-password` | Password reset completion           |

### 8.2 Patient (`/app`, guarded: patient or admin)

`index` · `search` · `medicine/$medicineId` · `compare` · `pharmacies` (index + `$pharmacyId`) · `prescriptions` · `reminders` · `interactions` · `labs` · `triage` · `assistant` · `cart` · `orders` · `verify` · `history` · `notifications` · `settings`

### 8.3 Pharmacy (`/pharmacy`, guarded)

`index` · `inventory` · `orders` · `prescriptions` · `customers` · `suppliers` · `analytics`

### 8.4 Doctor (`/doctor`, guarded)

`index` · `schedule` · `prescriptions`

### 8.5 Admin (`/admin`, guarded)

`index` · `users` · `pharmacies` · `catalog` · `moderation` · `audit`

### 8.6 Infrastructure

`/switch` (role switcher) · `/mcp` · `/.mcp/list-tools` · `/.mcp/invoke-tool/$tool` · `/.well-known/oauth-protected-resource` · `/.lovable/oauth/consent`

### 8.7 Layout composition

```tsx
// src/routes/app.tsx
<AppRouteGroup>
  {" "}
  {/* store provider + error boundary */}
  <RequireRole allow={["patient", "admin"]}>
    <PatientShell>
      <Outlet />
    </PatientShell>
  </RequireRole>
</AppRouteGroup>
```

Every parent route renders `<Outlet />`. Every guarded group repeats this composition with its own `allow` list and shell.

---

## 9. Authentication and authorisation

### 9.1 Database

```sql
create type public.app_role as enum ('patient','pharmacy','doctor','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, created_at timestamptz default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.user_roles where user_id = _user_id and role = _role
) $$;
```

Roles are in a **separate table**. Storing a role on `profiles` would let a user with update rights on their own profile row escalate to admin. `has_role` is `security definer` so RLS policies can call it without recursing.

Grants follow the required order: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`.

### 9.2 Client

`src/lib/auth.tsx` exposes `AuthProvider` and `useAuth()`:

| Member                                    | Purpose                                         |
| ----------------------------------------- | ----------------------------------------------- |
| `session`, `user`, `profile`, `roles`     | Current identity                                |
| `loading`                                 | Initial session hydration flag                  |
| `signIn(email, password)`                 | Email/password                                  |
| `signInWithGoogle()`                      | OAuth; `redirectTo` is a same-origin public URL |
| `signUp(email, password, fullName, role)` | Creates profile + role row                      |
| `resendVerification(email)`               | `supabase.auth.resend`, 45s cooldown in the UI  |
| `requestPasswordReset(email)`             | Emails a reset link                             |
| `signOut()`                               | Ends session and clears cached query data       |

### 9.3 Auth flow

```
Sign up → email verification step (resend, 45s cooldown)
        → verify → sign in → role resolution
        → single role  → that workspace
        → many roles   → /switch
Unauthenticated hit on a guarded route → /auth?next=<sanitised path>
Wrong role → explicit "wrong role" screen with a link to /switch
```

`next` is sanitised so `/auth` can never be its own redirect target, and `RequireRole` holds a navigation ref so a path transition cannot trigger a redirect loop.

### 9.4 Server-side rules

- A server function with `requireSupabaseAuth` middleware must never be called from a public route loader — prerender has no session and it 401s the build.
- `src/start.ts` registers the client-side `functionMiddleware` that attaches the bearer token.
- `process.env.*` is read inside handlers, never at module scope.

---

## 10. State management

Three distinct layers, deliberately not merged:

| Layer        | Tool                                     | Holds                                                              |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| Identity     | `AuthProvider`                           | session, profile, roles                                            |
| Server state | TanStack Query                           | catalogue, workspace resources                                     |
| Client state | `AppStoreProvider` (`src/lib/store.tsx`) | health profile, cart, reminders, history, notifications; persisted |

### The provider-reachability guarantee

Calling `useStore` outside `AppStoreProvider` throws. Three independent defences prevent that from reaching a user:

1. `AppRouteGroup` mounts the provider for every route group.
2. `eslint-rules/no-usestore-outside-provider.js` flags offending components at lint time.
3. `scripts/check-store-provider.mjs` (`npm run check:store`) statically walks route reachability.

Plus `src/test/root-store.test.tsx` renders the root and asserts `PatientShell` reaches the store, and `AppErrorBoundary` catches it as a last resort.

Hydration rule: browser storage is read in `useEffect` or behind a hydration flag — never in a `useState` initializer, because a `typeof window` guard there still produces a hydration mismatch.

---

## 11. The AI/ML experience layer

### 11.1 Pipeline

```
User input
 │
 ├─ 1. intent_detection      classify the request
 ├─ 2. entity_extraction     medicines, symptoms, duration, severity, allergies
 ├─ 3. provider_selection    find an adapter declaring this capability
 ├─ 4. retrieval             fetch real records; compute matchScore + rationale
 ├─ 5. safety_validation     run every rule against the composed text
 └─ 6. response_composition  typed payload + confidence + sources
 │
 └─→ AiEnvelope → UI → user feedback
```

Each stage records `{ name, label, status: ok|skipped|blocked, detail, ms }` in the envelope's `trace`, which the UI can surface so the user can see validation actually ran.

### 11.2 The envelope

```ts
interface AiEnvelope<T extends AiPayload> {
  id: string;
  capability: AiCapability;
  createdAt: string;
  providerId: string;
  providerLabel: string;
  mode: "demo" | "live";
  simulated: boolean; // true when nothing came from a live provider
  payload: T;
  confidence: AiConfidence; // level + score + rationale
  sources: AiSource[];
  safety: SafetyVerdict;
  followUps: string[];
  trace: PipelineStage[];
}
```

### 11.3 Capabilities and payloads

| Capability                | Payload                | Notes                                                                                                |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `medicine_explanation`    | `MedicineExplanation`  | composition, warnings, side effects, storage, supply status                                          |
| `natural_language_search` | `SearchInterpretation` | shows how the query was parsed and why each match surfaced                                           |
| `medicine_comparison`     | `MedicineComparison`   | criteria, rows, an explicit equivalence statement                                                    |
| `symptom_triage`          | `SymptomTriage`        | routing context, follow-up questions, monitoring plan, escalation level — **never a condition list** |
| `drug_interaction`        | `InteractionReport`    | duplicate ingredient / allergy match / not assessed, each with severity                              |
| `allergy_check`           | `AllergyReport`        | matches with the basis of each match                                                                 |
| `prescription_ocr`        | `OcrExtraction`        | per-line confidence and a `needsReview` flag                                                         |
| `lab_explanation`         | `LabExplanation`       | analytes with reference ranges plus a "what this is not"                                             |
| `patient_summary`         | `PatientSummary`       | plus questions to ask your clinician                                                                 |
| —                         | `InformationalAnswer`  | general fallback                                                                                     |
| —                         | `EscalationNotice`     | emitted on red flags, outside the normal answer path                                                 |
| —                         | `UnavailableNotice`    | honest gap + what a live provider would do                                                           |

### 11.4 Confidence

```ts
interface AiConfidence {
  level: "high" | "moderate" | "low" | "unverified";
  score: number;
  rationale: string;
}
```

`score` is derived from retrieval match quality supplied by the adapter (`matchScore` + `matchRationale`). **A model's self-reported confidence is never used** — models are systematically overconfident and a self-rated score in a health context is actively harmful.

### 11.5 Sources

```ts
interface AiSource {
  id: string;
  label: string;
  detail: string;
  kind: "catalogue" | "policy" | "user_input" | "model" | "external";
  reference?: string;
  updatedAt?: string;
  verified: boolean;
}
```

A source with `kind: "model"` and `verified: true` is a contradiction — the validator rejects it as a fabricated citation.

### 11.6 Provider adapter contract

```ts
interface MedoraAiProvider {
  id: string;
  label: string;
  mode: ProviderMode;
  capabilities: AiCapability[];
  description: string;
  explainMedicine(query): Promise<ProviderOutput<MedicineExplanation> | null>;
  answerInformational(query): Promise<ProviderOutput<InformationalAnswer>>;
  interpretSearch(query): Promise<ProviderOutput<SearchInterpretation>>;
  compareMedicines(ids): Promise<ProviderOutput<MedicineComparison> | null>;
  triage(req: TriageRequest): Promise<ProviderOutput<SymptomTriage>>;
  checkInteractions(
    meds,
    allergies,
  ): Promise<ProviderOutput<InteractionReport>>;
  checkAllergies(meds, allergies): Promise<ProviderOutput<AllergyReport>>;
  extractPrescription(file): Promise<ProviderOutput<OcrExtraction>>;
  explainLabReport(panel): Promise<ProviderOutput<LabExplanation> | null>;
  summarisePatient(
    req: PatientSummaryRequest,
  ): Promise<ProviderOutput<PatientSummary>>;
}
```

Returning `null` means "I cannot serve this" and the pipeline emits an `UnavailableNotice`. `capabilities` is the adapter's honest self-declaration; anything outside it is never attempted.

### 11.7 Conversation state machine

`src/ai/useAiConversation.ts` provides: streaming response state, typing indicator, retry on failure, error state, per-message feedback (`helpful` / `unhelpful` / `reported`), report with an optional note, clear conversation, persisted history and suggested prompts. Messages are keyed by envelope `id`.

---

## 12. Clinical safety system

`src/ai/safety.ts` runs **before** any payload can render.

### 12.1 Rules

| Rule                | Blocks                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `no_invented_price` | Any currency symbol or amount with a currency word — prices may only come from the verified price feed        |
| `no_invented_stock` | "in stock at", "out of stock at", "available now at", "N packs left"                                          |
| `no_diagnosis`      | "you have", "this is probably/likely/definitely", "you are suffering from", "diagnosis is", "I diagnose"      |
| `no_dosage`         | A verb + amount + unit (`take 500 mg`), or any frequency (`twice daily`, `every 6 hours`, `bd`, `tds`, `qid`) |
| `no_prescribing`    | "I recommend/prescribe/suggest you take/start/stop", "you should take/start/stop"                             |
| Source integrity    | Any `kind: "model"` source claiming `verified: true`                                                          |

The payload is flattened to text and every rule is run against it. A violation sets `passed: false`, and the UI renders `BLOCKED_COPY` instead of the response — explaining that Medora generated something that failed its own checks and directing the user to a pharmacist or prescriber.

`trustedFields` lets the pipeline exempt text it knows is safe by construction — fixed policy copy and verified catalogue fields — so a real, sourced price is not blocked as an invented one.

### 12.2 Red flags

```
chest pain · difficulty breathing · can't breathe · shortness of breath ·
unconscious · fainting · severe bleeding · coughing blood · suicide ·
self harm · stroke · seizure · anaphylaxis · swollen tongue · overdose ·
blue lips · worst headache
```

Detected on **raw user input**, before any provider runs. A hit sets `escalate: true` and surfaces emergency guidance above and outside the normal answer flow, so escalation cannot be buried by a slow or failing provider.

### 12.3 Escalation levels

`emergency` → `same_day` → `routine` → `self_monitor`, each paired with a concrete action string. Triage always resolves to exactly one level.

### 12.4 Role statement

```
Medora's assistant is an information tool. It is not a doctor, pharmacist
or prescriber, it does not diagnose, and it never tells you to start, stop
or change a medicine.
```

Displayed with the assistant, not hidden in a footer.

### 12.5 Non-AI safety surfaces

- **Prescription OCR** — every extracted line shows its confidence and must be user-confirmed (`userConfirmed`) before it can drive a reminder.
- **Interactions** — limited to duplicate active ingredients and declared allergies; the UI says explicitly that this is not a full interaction screen and that a pharmacist should review.
- **Rx gating** — `prescriptionOnly` items cannot be reserved without a linked prescription; the order sits at `awaiting_prescription`.
- **Lab reports** — every panel carries a `whatThisIsNot` statement.
- **Comparison** — equivalence is stated as composition equivalence, with substitution left to a pharmacist.

---

## 13. Patient experience — page by page

**Landing (`/`)** — editorial hero, the three problems Medora addresses, capability sections, and an honest data-status note. Session-aware header via `AuthHeaderAction`.

**Dashboard (`/app`)** — profile-aware greeting from the authenticated user; today's medicines; adherence; active safety alerts; open prescriptions; live order status. Storage reads are hydration-safe.

**Search (`/app/search`)** — free-text query interpreted into ingredient / strength / form / supply, with each match explaining why it surfaced, plus structured filters.

**Medicine detail (`/app/medicine/$id`)** — brand and generic names, active ingredients with strengths, form, pack size, manufacturer, Rx-only flag, neutral uses summary, warnings, common side effects, storage, provenance panel, and a link to comparison.

**Compare (`/app/compare`)** — equivalents grouped by composition key, lowest/highest spread, savings estimate, per-pharmacy listings with availability and last-updated timestamps.

**Pharmacies (`/app/pharmacies`)** — distance, open/closed and 24h status, services, licence ID, rating and review count; list/map toggle; detail page with stocked listings and contact.

**Prescriptions (`/app/prescriptions`)** — upload, extraction with per-line confidence, `needsReview` flags, mandatory confirmation, and a status lifecycle of extracted → reviewed → verified → rejected.

**Reminders (`/app/reminders`)** — built from confirmed lines; multiple times per day; start/end dates; taken/skipped log.

**Interactions (`/app/interactions`)** — duplicate-ingredient and allergy findings, each typed and severity-tagged, with `assessedBy` stated.

**Labs (`/app/labs`)** — analyte table with value, reference range, low/normal/high flag and plain-language explanation, plus the "what this is not" statement.

**Triage (`/app/triage`)** — structured intake (symptoms, free text, duration, severity, age band, pregnancy, current medicines, allergies, explicit red-flag checkboxes) producing follow-up questions, a windowed monitoring plan and an escalation level.

**Assistant (`/app/assistant`)** — streaming conversation, suggested prompts, typed answer cards, source chips, confidence badge, escalation banner, feedback and report, clear conversation, persisted history.

**Cart (`/app/cart`)** — reservation with Rx gating and pharmacy selection.

**Orders (`/app/orders`)** — full status timeline with per-state notes and timestamps.

**Verify (`/app/verify`)** — prescription verification progress.

**History (`/app/history`)** — searches, comparisons, uploads and orders.

**Notifications (`/app/notifications`)** — reminder, price, order, safety and system items with read state.

**Settings (`/app/settings`)** — profile, allergies, conditions, current medicines, pregnancy status, informational-use consent, data-processing consent, location sharing.

**Emergency (`/emergency`)** — red-flag signs and escalation guidance, reachable without a session.

**Command palette (`⌘K`)** — jump to any route, medicine or pharmacy.

---

## 14. Professional workspaces

### 14.1 Shared infrastructure

- `WorkspaceShell.tsx` — sidebar navigation from `nav-config.ts`, profile display, sign-out, breadcrumbs.
- `DataTable.tsx` — sorting, filtering, row actions, and first-class loading / error / empty states.
- `charts.tsx` — Recharts wrappers bound to Medora tokens (no default chart palette).
- `parts.tsx` — `StatTile`, `WorkspaceSection`, `Timeline`, `AiAssistNotice`, `AiAssistTag`. AI-assisted content is labelled with plain text, not iconography.

### 14.2 Pharmacy

| Page          | Contents                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Overview      | KPI tiles (orders awaiting action, verification backlog, low stock, expiring soon), trend charts    |
| Inventory     | Batch, stock vs reorder level, price, expiry with days-until, supplier; low-stock and expiry status |
| Orders        | Queue with status filters and detail dialogs showing items and timeline                             |
| Prescriptions | Verification queue with extraction confidence and AI-assist tags; verify/reject with a note         |
| Customers     | Profiles, order history, adherence signals                                                          |
| Suppliers     | Contacts, lead times, catalogue coverage                                                            |
| Analytics     | Sales over time, top movers, category mix                                                           |

### 14.3 Doctor

| Page          | Contents                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Overview      | Patient list with reason, status, allergies, current medicines and an AI-generated summary explicitly tagged as AI-assisted |
| Schedule      | Agenda view of appointments                                                                                                 |
| Prescriptions | Review queue plus a composer working from typed drafts                                                                      |

### 14.4 Admin

| Page       | Contents                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------- |
| Overview   | Platform metrics: users by role, verification backlog, moderation queue depth                |
| Users      | Search, role assignment and revocation against `user_roles`                                  |
| Pharmacies | Licence verification workflow with organisation records                                      |
| Catalogue  | Provenance auditing — which records are verified, which are demo, when each was last updated |
| Moderation | Report triage with resolution actions                                                        |
| Audit      | Immutable log: actor, action, target, timestamp, IP                                          |

---

## 15. Design system

All values are semantic tokens in `src/styles.css`. Components never use raw colour utilities such as `text-white`, `bg-black` or arbitrary hex.

### Palette

| Token                            | Value                    | Use                         |
| -------------------------------- | ------------------------ | --------------------------- |
| `--background`                   | `oklch(0.981 0.006 85)`  | Warm off-white page surface |
| `--foreground`                   | `oklch(0.245 0.032 254)` | Deep navy text              |
| `--primary`                      | clinical teal            | Actions, emphasis           |
| `--muted` / `--muted-foreground` |                          | Secondary surfaces and text |
| `--destructive`                  |                          | Errors, red-flag escalation |
| `--border` / `--ring`            |                          | Hairlines and focus         |

oklch is used so lightness steps stay perceptually even and contrast behaves predictably across hues.

### Typography

- Headings: **Manrope**
- Body: **Inter**
- Loaded via a `<link>` in `src/routes/__root.tsx` — never `@import` of a remote URL in `styles.css`, which Tailwind v4's Lightning CSS resolves from the filesystem.

### Rules

- Restrained border radii; no pill-shaped cards
- No gradients, no glassmorphism, no backdrop blur as decoration
- Icons are functional and sized to the text they sit beside; no sparkle or wand iconography
- No invented statistics, no fake testimonials, no placeholder copy
- Density is intentional: tables are tight, reading columns are wide

---

## 16. Component library

**`src/components/ui/`** — 40+ shadcn/ui components over Radix: accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

Note: `@/hooks/use-toast` and `@/components/ui/toaster` do **not** exist in this stack. Use `sonner` via `@/components/ui/sonner`, mounted once in `__root.tsx`.

**Application components**

| Component                                    | Purpose                                                              |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `AppRouteGroup`                              | Store provider + error boundary for a route group                    |
| `PatientShell`                               | Patient navigation, responsive header/sidebar                        |
| `WorkspaceShell`                             | Professional navigation and chrome                                   |
| `CommandPalette`                             | Global `⌘K` search                                                   |
| `RequireRole`                                | Role guard with wrong-role screen                                    |
| `AuthHeaderAction`                           | Session-aware landing CTA                                            |
| `AppErrorBoundary`                           | Fallback screen with Reload                                          |
| `MedicineCard`                               | Catalogue result card                                                |
| `AiPayloadView`                              | Renders every `AiPayload` variant                                    |
| `ai-parts`                                   | Confidence badge, provenance chips, safety notice, feedback controls |
| `DataTable`                                  | Workspace tables with full state coverage                            |
| `StatTile` / `Timeline` / `WorkspaceSection` | Workspace layout primitives                                          |

---

## 17. MCP / agent integration

Medora exposes an MCP server so AI agents can query it directly.

| Tool               | Input                         | Output                             |
| ------------------ | ----------------------------- | ---------------------------------- |
| `search_medicines` | query, optional filters       | Matching medicines with provenance |
| `get_medicine`     | medicine id                   | Full record                        |
| `compare_prices`   | medicine id / composition key | Listings across pharmacies         |
| `find_pharmacies`  | location, optional filters    | Pharmacies with services and hours |

**Endpoints** — `/mcp`, `/.mcp/list-tools`, `/.mcp/invoke-tool/$tool`, `/.well-known/oauth-protected-resource`, `/.lovable/oauth/consent`.

**Constraints** — every tool is read-only. No agent-callable tool can place an order, mutate a prescription, change a role or read another user's data. Tool responses carry the same provenance as the UI, so an agent cannot present demo data as verified either.

Public HTTP endpoints intended for external callers live under `src/routes/api/public/*`, which bypasses site auth — so any such handler must verify its caller itself (signature check, zod validation, no PII in responses).

---

## 18. Error handling and resilience

| Layer                  | Mechanism                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| Render errors          | `AppErrorBoundary` — safe fallback with Reload                    |
| Route errors           | TanStack Router error components                                  |
| Query errors           | TanStack Query `retry: 1` + explicit error UI with a retry action |
| Provider gaps          | `UnavailableNotice` instead of improvisation                      |
| Unsafe AI output       | `BLOCKED_COPY` instead of the payload                             |
| Missing store provider | Lint rule + static script + test + boundary                       |
| Auth failures          | Typed messages on the auth page; no silent redirects              |
| Reporting              | `error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` |

Every async surface has four states — loading, error, empty and success — and empty states explain what would fill them rather than just saying "no data".

---

## 19. Testing and quality gates

| Gate           | Command               | Status                                             |
| -------------- | --------------------- | -------------------------------------------------- |
| Typecheck      | `tsgo`                | Clean                                              |
| Lint           | `npm run lint`        | Error-free (6 benign shadcn fast-refresh warnings) |
| Format         | `npm run format`      | Prettier enforced                                  |
| Tests          | `npm run test`        | 1 integration test                                 |
| Store provider | `npm run check:store` | Passing                                            |

`src/test/root-store.test.tsx` renders the root route and asserts `PatientShell` can read the store without throwing.

**Gaps** — no unit tests for `safety.ts`, `pipeline.ts` or `intent.ts`; no component tests for `DataTable` or forms; no E2E suite; no CI pipeline.

---

## 20. Performance

- SSR via TanStack Start for fast first paint
- Route-level code splitting from file-based routing
- TanStack Query caching with a 30s `staleTime` on workspace resources
- Browser-only libraries are dynamically imported after hydration; `<ClientOnly>` gates rendering, not imports
- Images lazy-loaded
- `sideEffects: false` for tree shaking

Not yet done: bundle analysis, a performance budget, and a route-level splitting review.

---

## 21. Accessibility

**Present** — semantic HTML, Radix primitives (keyboard interaction, focus trapping and ARIA largely inherited), labelled form controls, visible focus states, tokens chosen with contrast in mind, `⌘K` palette as a keyboard-first navigation path.

**Outstanding** — a full keyboard-navigation pass over every flow, a screen-reader audit, a WCAG AA contrast audit of every token pairing, a skip-to-content link, and a reduced-motion review.

---

## 22. SEO and metadata

Each content route defines its own `head()` with a unique title, description, `og:title` and `og:description`. `og:type` and `twitter:card` are set. No relative or placeholder image URLs are used.

Canonical site metadata:

- **Title** — `Medora — Compare medicine prices & pharmacies nearby`
- **Description** — `Look up any medicine, compare verified pharmacy prices near you and make sense of prescriptions — informational only, never a diagnosis.`

Also in place: a single `<h1>` per page, semantic sectioning, alt text on images, `public/robots.txt`, and a responsive viewport.

---

## 23. Security posture

| Control           | Implementation                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Role storage      | Separate `user_roles` table; never a profile column                                                            |
| Role checks       | `has_role()` security-definer function inside RLS policies                                                     |
| Table access      | Explicit `GRANT`s alongside RLS on every public table                                                          |
| Client keys       | Only the publishable key reaches the browser                                                                   |
| Server secrets    | Read inside handlers via `process.env`; never bundled                                                          |
| Admin client      | Loaded inside a handler only after the caller is verified; never used to decide whether the caller is an admin |
| Agent tools       | Read-only                                                                                                      |
| Public API routes | Must verify their own caller — the `/api/public/*` prefix bypasses site auth                                   |
| Redirects         | `next` sanitised; `/auth` cannot target itself                                                                 |
| Session           | Cleared on sign-out along with cached query data                                                               |

**Outstanding** — recurring security and dependency scans, rate limiting on MCP endpoints, 2FA, and structured audit-log export.

---

## 24. Deployment and operations

**Build** — `npm run build` (production) or `npm run build:dev`. Output targets an edge Worker runtime.

**Runtime constraints.** Server functions run in a serverless Worker, not full Node. Available: `fs` (virtual), `path`, `crypto`, `Buffer`, `stream`, `url`, `events`, `timers`, `net`, `http`, `https`, `zlib`. Not available: `child_process`, `sharp`, `canvas`, `puppeteer`, `fs.watch`, `os.cpus()`. All npm packages must bundle at build time — there is no runtime module resolution, and `ssr.external` must never be set in `vite.config.ts`.

**Environment**

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

Browser config uses `import.meta.env.VITE_*`; server config uses `process.env` inside handlers.

**Stable URLs for external callers**

- `project--{project-id}.lovable.app` — production
- `project--{project-id}-dev.lovable.app` — preview

---

## 25. Extension guides

### Add an AI capability

1. Add the capability name and payload interface to `src/ai/schemas.ts`; extend the `AiPayload` union.
2. Add the method to `MedoraAiProvider` in `src/ai/provider-types.ts`.
3. Implement it in an adapter and declare it in `capabilities`.
4. Add a case to `AiPayloadView`.
5. Confirm `safety.ts` covers any new claim type the payload can carry — extend the rules if not.

### Register a live AI provider

```ts
// src/ai/providers/live.ts
export const liveProvider: MedoraAiProvider = {
  id: "live-llm",
  label: "…",
  mode: "live",
  capabilities: ["medicine_explanation", "natural_language_search"],
  description: "…",
  async explainMedicine(query) {
    const result = await callModel(query);
    return {
      payload: result,
      sources: retrievedRecords.map(toSource), // real records only
      matchScore: computeFromRetrieval(), // never model self-report
      matchRationale: "…",
    };
  },
  // …
};
```

Register it in `src/ai/registry.ts`. The safety validator stays unchanged and remains authoritative — a live provider gets no exemptions.

### Add a live data source

Change the loader body in `src/services/*`. Set `Provenance.verified` truthfully. No component changes.

### Add a workspace page

Add the resource to `workspaceLoaders`, create the route file, compose `WorkspaceShell` + `DataTable` / `StatTile` / charts with real loading, error and empty states, and register it in `nav-config.ts`.

### Add a database table

```sql
CREATE TABLE public.x (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;
GRANT ALL ON public.x TO service_role;
ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ON public.x FOR SELECT TO authenticated USING (...);
```

That order, in one migration. RLS without grants is unreachable; grants without RLS are unguarded.

---

## 26. Conventions

**TypeScript** — strict; no `any`; discriminated unions with a `kind` field for every variant type; literal-typed resource keys.

**Naming** — components `PascalCase.tsx`; hooks `useThing.ts`; routes follow the file-based convention (`app.medicine.$medicineId.tsx`); services and libs `kebab-case.ts`.

**Imports** — `@/` alias for `src/`; no unused imports; no direct import of a `*.server.ts` module from a component.

**Styling** — tokens only; `cn()` for conditional classes; no arbitrary colour values.

**Data** — never read demo arrays from a route; always go through `src/services/*`.

**Safety** — every AI response passes through the pipeline; nothing bypasses `safety.ts`.

**Never edit** — `src/routeTree.gen.ts`, `src/integrations/supabase/*` (generated), `supabase/config.toml`, `.env`.

---

## 27. Glossary

| Term                   | Meaning                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Composition key**    | `ingredient + strength + form`; the basis of equivalence grouping                                           |
| **Provenance**         | Source, last-updated date and verified flag on a record                                                     |
| **Envelope**           | The wrapper around every AI response carrying provider, mode, confidence, sources, safety verdict and trace |
| **Capability**         | A named AI function an adapter may declare it can serve                                                     |
| **Adapter / provider** | An implementation of `MedoraAiProvider`                                                                     |
| **Red flag**           | A term in user input that triggers immediate emergency escalation                                           |
| **Escalation level**   | emergency / same_day / routine / self_monitor                                                               |
| **Safety verdict**     | The validator's result: rules run, violations, red flags, escalate, notice                                  |
| **Simulated**          | Nothing in the payload came from a connected live provider                                                  |
| **Settle**             | The latency-simulating helper every data read passes through                                                |
| **Trace**              | Per-stage timing and status record for one pipeline run                                                     |
| **Route group**        | A guarded prefix (`/app`, `/pharmacy`, `/doctor`, `/admin`) sharing a shell and role gate                   |

---

## Disclaimer

Medora provides health information, not medical advice. It is not a doctor, pharmacist or prescriber. It does not diagnose and it never tells anyone to start, stop or change a medicine. In an emergency, contact your local emergency number.
