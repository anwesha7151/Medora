import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { demoMedicines, demoPharmacies } from "@/data/demo-catalog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";
import { adminNav, doctorNav, patientNav, pharmacyNav } from "./nav-config";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { state } = useStore();

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to: to as "/app" });
  };

  const nav =
    state.role === "pharmacy"
      ? pharmacyNav
      : state.role === "doctor"
        ? doctorNav
        : state.role === "admin"
          ? adminNav
          : patientNav;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Medora command palette"
      description="Search medicines, pharmacies, prescriptions, reminders and settings"
    >
      <CommandInput placeholder="Search medicines, pharmacies, pages…" />
      <CommandList>
        <CommandEmpty>
          Nothing matched. Try a brand name, an ingredient or a page.
        </CommandEmpty>
        <CommandGroup heading="Go to">
          {nav.map((item) => (
            <CommandItem
              key={item.to}
              value={`page ${item.label}`}
              onSelect={() => go(item.to)}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
              {item.to === "/app" && <CommandShortcut>⌘K</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Medicines (demo catalogue)">
          {demoMedicines.slice(0, 8).map((m) => (
            <CommandItem
              key={m.id}
              value={`medicine ${m.brandName} ${m.genericName}`}
              onSelect={() => go(`/app/medicine/${m.id}`)}
            >
              <span className="font-medium">{m.brandName}</span>
              <span className="text-muted-foreground">
                {m.genericName} · {m.activeIngredients[0]?.strength} · {m.form}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pharmacies (demo directory)">
          {demoPharmacies.map((p) => (
            <CommandItem
              key={p.id}
              value={`pharmacy ${p.name}`}
              onSelect={() => go(`/app/pharmacies/${p.id}`)}
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">{p.distanceKm} km</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Your records">
          {state.prescriptions.slice(0, 4).map((rx) => (
            <CommandItem
              key={rx.id}
              value={`prescription ${rx.fileName} ${rx.prescriberName}`}
              onSelect={() => go("/app/prescriptions")}
            >
              <span className="font-medium">{rx.fileName}</span>
              <span className="text-muted-foreground">{rx.status}</span>
            </CommandItem>
          ))}
          {state.reminders.map((r) => (
            <CommandItem
              key={r.id}
              value={`reminder ${r.medicineName}`}
              onSelect={() => go("/app/reminders")}
            >
              <span className="font-medium">{r.medicineName}</span>
              <span className="text-muted-foreground">
                {r.times.join(", ")}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
