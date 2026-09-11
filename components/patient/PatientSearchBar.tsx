import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  Pill,
  Search,
  ShieldAlert,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/workspace/parts";
import { useStore } from "@/lib/store";
import { useWorkspaceData } from "@/services/workspace";
import type { DoctorPatient } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface PatientSearchBarProps {
  onSelectPatient?: ((patient: DoctorPatient) => void) | undefined;
  className?: string | undefined;
}

export function PatientSearchBar({
  onSelectPatient,
  className,
}: PatientSearchBarProps) {
  const { logActivity } = useStore();
  const patientsQuery = useWorkspaceData("doctorPatients");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  const patients: DoctorPatient[] = patientsQuery.data ?? [];

  const filteredPatients = useMemo(() => {
    if (!query.trim() && statusFilter === "all") return patients;

    const q = query.toLowerCase().trim();
    return patients.filter((p) => {
      const matchesText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q) ||
        p.allergies.some((a) => a.toLowerCase().includes(q)) ||
        p.currentMedicines.some((m) => m.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      return matchesText && matchesStatus;
    });
  }, [patients, query, statusFilter]);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);
    if (val.trim().length > 2) {
      logActivity({
        action: "search",
        title: `Patient Search: '${val}'`,
        detail: `Queried clinical database for matching patient medical records.`,
      });
    }
  };

  const handleSelect = (patient: DoctorPatient) => {
    setIsOpen(false);
    if (onSelectPatient) {
      onSelectPatient(patient);
    }
    logActivity({
      action: "view_medicine",
      title: `Viewed Patient: ${patient.name}`,
      detail: `${patient.ageBand} · ${patient.reason}`,
    });
  };

  return (
    <div
      id="patient-search-bar-container"
      className={cn("rise relative w-full space-y-2", className)}
    >
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="patient-query-input"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search patient by name, condition, current meds, or allergies (e.g. Ramesh, Diabetes, Penicillin)…"
          className="h-11 rounded-lg border-border bg-card pl-10 pr-20 text-sm shadow-soft focus:border-primary"
        />

        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-ink"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
            >
              <X className="size-3.5" />
            </Button>
          )}
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            {filteredPatients.length} found
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors",
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
          )}
        >
          All Patients ({patients.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors",
            statusFilter === "active"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
          )}
        >
          Active Consultations
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("scheduled")}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors",
            statusFilter === "scheduled"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
          )}
        >
          Scheduled Appointments
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("closed")}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors",
            statusFilter === "closed"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
          )}
        >
          Past Records
        </button>
      </div>

      {/* Dropdown Results List (when active query or open) */}
      {isOpen && (
        <div
          id="patient-search-results-dropdown"
          className="surface rise absolute top-full left-0 z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-border p-2 shadow-lift"
        >
          {filteredPatients.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching patient records found in clinical database.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredPatients.map((patient) => {
                const statusTone =
                  patient.status === "in_consult"
                    ? "positive"
                    : patient.status === "waiting"
                      ? "warning"
                      : patient.status === "review"
                        ? "info"
                        : "neutral";

                return (
                  <div
                    key={patient.id}
                    id={`patient-result-${patient.id}`}
                    onClick={() => handleSelect(patient)}
                    className="group flex cursor-pointer items-start justify-between rounded-md border border-transparent p-3 text-xs transition-colors hover:border-border hover:bg-secondary/40"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">
                          {patient.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {patient.ageBand}
                        </Badge>
                        <StatusPill label={patient.status} tone={statusTone} />
                      </div>

                      <p className="text-muted-foreground">
                        <span className="font-medium text-ink">Reason:</span>{" "}
                        {patient.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {patient.currentMedicines.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Pill className="size-3 text-primary" />
                            {patient.currentMedicines.join(", ")}
                          </span>
                        )}

                        {patient.allergies.length > 0 && (
                          <span className="flex items-center gap-1 rounded bg-warning-soft/60 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                            <ShieldAlert className="size-3" />
                            Allergy: {patient.allergies.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-right">
                      <span className="text-[10px] text-muted-foreground">
                        Last Visit: {patient.lastVisit}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(patient);
                        }}
                      >
                        Select Record →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
