import { Link } from "@tanstack/react-router";
import { Check, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RxPill } from "@/components/common/primitives";
import type { Medicine } from "@/lib/domain";
import { formatMoney } from "@/services/medicines";
import { cn } from "@/lib/utils";

export function MedicineCard({
  medicine,
  lowestPrice,
  selected,
  onToggleCompare,
}: {
  medicine: Medicine;
  lowestPrice?: number | undefined;
  selected?: boolean | undefined;
  onToggleCompare?: (() => void) | undefined;
}) {
  const ingredient = medicine.activeIngredients[0];
  return (
    <article
      className={cn(
        "surface flex flex-col gap-3 p-5 transition-shadow hover:shadow-soft",
        selected && "border-primary/50 ring-1 ring-primary/25",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/app/medicine/$medicineId"
            params={{ medicineId: medicine.id }}
            className="font-display text-base font-bold text-ink hover:underline"
          >
            {medicine.brandName}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {medicine.genericName} · {ingredient?.strength} · {medicine.form}
          </p>
        </div>
        <RxPill prescriptionOnly={medicine.prescriptionOnly} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <dt className="text-muted-foreground">Manufacturer</dt>
          <dd className="font-medium text-foreground">
            {medicine.manufacturer}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pack size</dt>
          <dd className="font-medium text-foreground">{medicine.packSize}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-sm">
          {lowestPrice != null ? (
            <>
              <span className="numeric font-semibold text-ink">
                {formatMoney(lowestPrice)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                lowest demo listing
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              No listing in demo data
            </span>
          )}
        </p>
        {onToggleCompare && (
          <Button
            variant={selected ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleCompare}
            aria-pressed={selected}
          >
            {selected ? (
              <>
                <Check className="size-3.5" aria-hidden /> Selected
              </>
            ) : (
              <>
                <GitCompareArrows className="size-3.5" aria-hidden /> Compare
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
