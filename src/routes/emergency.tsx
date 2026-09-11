import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/primitives";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency guidance — Medora" },
      {
        name: "description",
        content:
          "What to do right now if you or someone else has emergency warning signs. Medora cannot assess emergencies.",
      },
      { property: "og:title", content: "Emergency guidance — Medora" },
      {
        property: "og:description",
        content:
          "Emergency warning signs and how to get professional help immediately.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmergencyPage,
});

const warningSigns = [
  "Chest pain, pressure or tightness",
  "Severe difficulty breathing, or blue lips or face",
  "Sudden weakness, facial droop or trouble speaking",
  "Heavy bleeding that will not stop",
  "Someone is unresponsive, or having a seizure that will not stop",
  "Sudden swelling of the lips, tongue or throat after a medicine, food or sting",
  "Thoughts of harming yourself or someone else",
  "A suspected overdose of any medicine",
];

function EmergencyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to Medora
        </Link>
        <div className="mt-8 rounded-xl border border-destructive/45 bg-destructive-soft p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-6 text-destructive" aria-hidden />
            <h1 className="text-2xl font-bold">Get emergency help now</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Medora is an informational product. It cannot assess an emergency,
            and it will never tell you to wait. If any of the warning signs
            below apply, contact emergency services in your country immediately
            or go to the nearest emergency department.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="destructive">
              <a href="tel:112">
                <PhoneCall className="size-4" aria-hidden /> Call emergency
                services
              </a>
            </Button>
            <p className="self-center text-xs text-muted-foreground">
              Emergency numbers differ by country — 112 in much of Europe, 911
              in the US and Canada, 999 in the UK, 108 or 112 in India.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-bold">
            Warning signs that need emergency care
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {warningSigns.map((sign) => (
              <li key={sign} className="surface flex gap-2 p-3 text-sm">
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive"
                />
                {sign}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-lg border border-border bg-card p-5 text-sm">
          <h2 className="text-base font-bold">While you wait for help</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Stay with the person if you can do so safely.</li>
            <li>
              Have any medicine packs or a prescription list ready to show
              responders.
            </li>
            <li>
              Do not give any medicine unless a professional tells you to.
            </li>
            <li>
              Follow the instructions of the emergency operator, not this page.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
