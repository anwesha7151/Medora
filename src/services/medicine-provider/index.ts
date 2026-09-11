import { DemoMedicineProvider } from "./demo";
import { LiveMedicineProvider } from "./live";
import type { IMedicineProvider } from "./types";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export const demoProvider = new DemoMedicineProvider();
export const liveProvider = new LiveMedicineProvider();

let activeProvider: IMedicineProvider = isSupabaseConfigured
  ? liveProvider
  : demoProvider;

export const setProvider = (useLive: boolean) => {
  activeProvider = useLive ? liveProvider : demoProvider;
};

export const getProvider = () => activeProvider;
export * from "./types";
