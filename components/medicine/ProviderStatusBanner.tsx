import { useEffect, useState } from "react";
import { ServerOff } from "lucide-react";
import { getProvider } from "@/services/medicine-provider";

export function ProviderStatusBanner() {
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
    isLive: boolean;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const provider = getProvider();
    provider.getStatus().then((s) => {
      if (mounted) {
        setStatus({ ...s, isLive: provider.isLive });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!status) return null;

  // When live and connected, hide banner completely
  if (status.connected) {
    return null;
  }

  // Only show warning if provider connection failed
  return (
    <div className="bg-warning/20 border-b border-warning/50 px-4 py-2 text-sm text-warning-foreground flex items-center justify-center gap-2">
      <ServerOff className="size-4" aria-hidden />
      <span className="font-medium">Live medicine database offline.</span>
      <span className="opacity-80">
        Falling back to local cached catalogue.
      </span>
    </div>
  );
}
