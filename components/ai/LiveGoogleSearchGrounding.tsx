import { useState } from "react";
import {
  AlertOctagon,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCheck2,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  Pill,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  GroundedSearchResponse,
  GroundedSource,
} from "@/routes/api.grounded-search";

interface LiveGoogleSearchGroundingProps {
  initialQuery?: string;
  initialContextType?:
    | "clinical_trial"
    | "drug_safety"
    | "pricing_guideline"
    | "general"
    | "interaction";
  patientContext?: string;
  className?: string;
  compact?: boolean;
}

const PRESET_CLINICAL_PROMPTS = [
  {
    category: "drug_safety",
    label: "CDSCO Banned FDCs 2024–2026",
    query:
      "Latest CDSCO notifications and bans on unapproved fixed-dose combinations (FDCs) in India",
  },
  {
    category: "clinical_trial",
    label: "SGLT2i Renal Outcomes 2025",
    query:
      "Latest clinical trials and guidelines on SGLT2 inhibitors in chronic kidney disease (CKD)",
  },
  {
    category: "drug_safety",
    label: "Fluoroquinolones Blackbox Warnings",
    query:
      "Recent safety alerts on fluoroquinolones, tendon rupture, and aortic aneurysm risk",
  },
  {
    category: "pricing_guideline",
    label: "NPPA Diabetes Ceiling Prices",
    query:
      "NPPA ceiling prices and Jan Aushadhi generic equivalents for Sitagliptin, Vildagliptin, and Dapagliflozin",
  },
  {
    category: "clinical_trial",
    label: "Semaglutide / GLP-1 RA in India",
    query:
      "Semaglutide clinical trials, approved indications in India, and cardiovascular safety endpoints",
  },
];

export function LiveGoogleSearchGrounding({
  initialQuery = "",
  initialContextType = "general",
  patientContext,
  className,
  compact = false,
}: LiveGoogleSearchGroundingProps) {
  const [query, setQuery] = useState(initialQuery);
  const [contextType, setContextType] = useState<
    | "clinical_trial"
    | "drug_safety"
    | "pricing_guideline"
    | "general"
    | "interaction"
  >(initialContextType);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GroundedSearchResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const executeSearch = async (
    searchQueryToRun?: string,
    typeToRun?: typeof contextType,
  ) => {
    const q = (searchQueryToRun ?? query).trim();
    if (!q) {
      toast.error("Please enter a clinical query or topic to search.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/grounded-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          contextType: typeToRun ?? contextType,
          patientContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = (await res.json()) as GroundedSearchResponse;
      setResult(data);
      toast.success("Live search grounding complete", {
        description: `Retrieved evidence using ${data.modelUsed} with ${data.sources.length} verified web source(s).`,
      });
    } catch (err: any) {
      console.error("Grounding query error:", err);
      toast.error("Failed to query live Google Search grounding", {
        description: err.message || "Network error. Please retry.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `MEDORA CLINICAL INTELLIGENCE (GOOGLE SEARCH GROUNDED)\nQuery: ${query}\nModel: ${result.modelUsed}\nTimestamp: ${result.timestamp}\n\n${result.answer}\n\nSources:\n${result.sources.map((s) => `- ${s.title} (${s.url})`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Clinical research summary copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-5",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Globe className="size-4" />
            </div>
            <h3 className="font-display font-extrabold text-base text-foreground flex items-center gap-2">
              Live Google Search Grounding & Clinical Intelligence
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time web search grounding powered by{" "}
            <strong className="text-foreground">Gemini 3.7 Flash</strong> with{" "}
            <code className="text-primary font-mono text-[11px] bg-primary/10 px-1.5 py-0.5 rounded">
              googleSearch
            </code>{" "}
            tool. Retrieves verified 2024–2026 clinical trials, CDSCO notices,
            and NPPA price schedules.
          </p>
        </div>

        <Badge
          variant="outline"
          className="h-7 gap-1.5 border-primary/40 bg-primary/10 text-primary font-bold text-xs shrink-0 self-start sm:self-center"
        >
          <Sparkles className="size-3 text-primary animate-pulse" />
          Live Google Search Tool Enabled
        </Badge>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {[
          { id: "general", label: "General Clinical Evidence", icon: Sparkles },
          {
            id: "drug_safety",
            label: "CDSCO & FDA Safety Alerts",
            icon: ShieldAlert,
          },
          {
            id: "clinical_trial",
            label: "Clinical Trials & Endpoints",
            icon: BookOpen,
          },
          {
            id: "pricing_guideline",
            label: "NPPA & Jan Aushadhi Pricing",
            icon: FileCheck2,
          },
        ].map((cat) => {
          const Icon = cat.icon;
          const isSelected = contextType === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setContextType(cat.id as any)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground font-bold shadow-soft"
                  : "bg-muted/50 border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeSearch();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recent drug recalls, CDSCO circulars, latest clinical trials (e.g., 'Metformin MALA advisory' or 'Dapagliflozin CKD trials')..."
            className="h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl font-medium"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-11 px-5 rounded-xl font-bold text-xs sm:text-sm gap-2 shadow-soft shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Searching Web…
            </>
          ) : (
            <>
              <Globe className="size-4" />
              Ground with Google Search
            </>
          )}
        </Button>
      </form>

      {/* Quick Clinical Prompts */}
      {!result && !loading && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Suggested Clinical Topics to Ground:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_CLINICAL_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setQuery(p.query);
                  setContextType(p.category as any);
                  executeSearch(p.query, p.category as any);
                }}
                className="rounded-xl border border-border/80 bg-background/60 hover:bg-primary/5 hover:border-primary/40 px-3 py-1.5 text-xs text-foreground transition-all text-left flex items-center gap-1.5 shadow-2xs"
              >
                <Pill className="size-3 text-primary shrink-0" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-6 space-y-4 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Loader2 className="size-4 animate-spin" />
            <span>
              Consulting Google Search live index & synthesizing clinical
              guidelines with Gemini 3.7 Flash…
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-3/4" />
            <div className="h-4 bg-muted rounded-md w-full" />
            <div className="h-4 bg-muted rounded-md w-5/6" />
          </div>
        </div>
      )}

      {/* Grounded Results Display */}
      {result && !loading && (
        <div className="rounded-2xl border border-border/80 bg-background p-5 shadow-soft space-y-5 animate-in fade-in duration-300">
          {/* Metadata & Actions Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs font-bold gap-1">
                <CheckCircle2 className="size-3.5" /> Google Search Grounded
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground">
                Model:{" "}
                <strong className="text-foreground">{result.modelUsed}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 text-xs gap-1.5 text-muted-foreground"
              >
                <Copy className="size-3.5" />
                {copied ? "Copied" : "Copy Finding"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeSearch()}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </Button>
            </div>
          </div>

          {/* Web Search Queries Used */}
          {result.searchQueries.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Live Google Search Queries Executed:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.searchQueries.map((sq, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    <Search className="size-2.5" />
                    {sq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Formatted Grounded Content */}
          <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line space-y-3 font-normal">
            {result.answer}
          </div>

          {/* Web Sources & Citations with Direct Links */}
          {result.sources.length > 0 && (
            <div className="pt-4 border-t border-border/60 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Globe className="size-3.5 text-primary" /> Verified Grounding
                Sources & Web Citations ({result.sources.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-colors text-xs group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {src.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate font-mono">
                        {src.url}
                      </p>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
