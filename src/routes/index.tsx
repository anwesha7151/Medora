import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  FileScan,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthHeaderAction } from "@/components/auth/AuthHeaderAction";
import {
  ClinicalDisclaimer,
  DemoBadge,
  Logo,
} from "@/components/common/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medora — Compare medicine prices & pharmacies nearby" },
      {
        name: "description",
        content:
          "Look up any medicine, compare verified pharmacy prices near you and make sense of prescriptions — informational only, never a diagnosis.",
      },
      {
        property: "og:title",
        content: "Medora — Compare medicine prices & pharmacies nearby",
      },
      {
        property: "og:description",
        content:
          "Look up any medicine, compare verified pharmacy prices near you and make sense of prescriptions — informational only, never a diagnosis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

interface Pathway {
  to: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
}

const pathways: Pathway[] = [
  {
    to: "/app/search",
    eyebrow: "01 — Look it up",
    title: "Medicine search",
    body: "Brand name, generic name or active ingredient. Every record shows composition, warnings and where the information came from.",
    icon: Search,
  },
  {
    to: "/app/prescriptions",
    eyebrow: "02 — Read the paper",
    title: "Prescription upload",
    body: "Each extracted line arrives with a confidence score you can correct. Nothing is used until you confirm it.",
    icon: FileScan,
  },
  {
    to: "/app/pharmacies",
    eyebrow: "03 — Find it nearby",
    title: "Pharmacy discovery",
    body: "Licensed dispensaries with opening hours, services, stock signals and a licence identifier you can check.",
    icon: MapPin,
  },
  {
    to: "/app/assistant",
    eyebrow: "04 — Ask a question",
    title: "Medicine assistant",
    body: "Plain-language explanations with the source attached. It will not diagnose you and it will not prescribe.",
    icon: MessageSquareText,
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Gaps are labelled, not filled",
    body: "Where a provider is not connected, Medora says so instead of inventing a plausible answer.",
  },
  {
    icon: BadgeCheck,
    title: "Composition is not quality",
    body: "Two products can share an active ingredient, strength and form and still differ. Medora never implies otherwise.",
  },
  {
    icon: Stethoscope,
    title: "Routing, never diagnosis",
    body: "Triage tells you where to go and when. Red flags escalate to emergency guidance immediately.",
  },
];

const quickStats = [
  { label: "Medicines tracked", value: "3.2k+" },
  { label: "Nearby pharmacy checks", value: "24/7" },
  { label: "Sources shown", value: "100%" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <DemoBadge />
            <AuthHeaderAction />
          </div>
        </div>
      </header>

      <main>
        {/* Editorial hero */}
        <section className="hero-wash border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Medicine intelligence
                </p>
                <h1 className="mt-5 max-w-[16ch] font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[4.1rem]">
                  Understand your medicine.
                  <span className="block text-primary">
                    Compare verified options.
                  </span>
                  <span className="block">Find care nearby.</span>
                </h1>
                <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  One calm workspace for the questions that come after a
                  prescription: what is this, what does it cost elsewhere, where
                  can I get it today, and when should I stop reading and see
                  someone.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link to="/auth" search={{ next: "/app" }}>
                      Open the patient app{" "}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/switch">Professional workspaces</Link>
                  </Button>
                </div>

                <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                  {quickStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border bg-card/80 p-3 shadow-soft"
                    >
                      <p className="text-2xl font-bold tracking-tight text-ink">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm text-muted-foreground">
                  Chest pain, breathlessness or severe bleeding?{" "}
                  <Link
                    to="/emergency"
                    className="font-semibold text-destructive underline"
                  >
                    Read the emergency guidance first
                  </Link>
                </p>
              </div>

              <div className="rounded-[28px] border border-border bg-card/90 p-4 shadow-lift backdrop-blur-sm">
                <div className="rounded-[22px] border border-border bg-secondary/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                    <span>Pharmacy price signal</span>
                    <span className="rounded-full bg-success-soft px-2 py-1 text-xs font-semibold text-success">
                      Live demo
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { k: "Composition-matched", v: "Equivalence" },
                      { k: "Per unit, not per pack", v: "Pricing" },
                      { k: "Licence shown", v: "Pharmacies" },
                      { k: "Source on every claim", v: "Provenance" },
                    ].map((s) => (
                      <div
                        key={s.v}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                          {s.v}
                        </dt>
                        <dd className="mt-2 font-display text-base font-bold leading-snug text-ink">
                          {s.k}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four primary pathways — the visual hierarchy of the product */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Four ways in
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Every path below is live in the demo environment and runs on
              clearly labelled sample data.
            </p>
          </div>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {pathways.map((p) => (
              <Link
                key={p.to}
                to={p.to as "/app/search"}
                className="group flex flex-col bg-card p-7 transition-colors hover:bg-secondary/60"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                    <p.icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {p.eyebrow}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Open
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-2xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Built to be trusted with the boring, important details
            </h2>
            <div className="mt-10 grid gap-10 sm:grid-cols-3">
              {principles.map((p) => (
                <article key={p.title}>
                  <p.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 text-base font-bold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <ClinicalDisclaimer />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-6">
          <Logo compact />
          <p className="max-w-lg">
            Demo environment. Catalogue, pricing, OCR and clinical adapters are
            sample providers — nothing here is live healthcare information.
          </p>
        </div>
      </footer>
    </div>
  );
}
