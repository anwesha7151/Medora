import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time runtime errors thrown by app code — including provider
 * errors such as "useStore must be used inside <AppStoreProvider>" — and shows
 * a calm fallback instead of a blank screen.
 */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary caught an error", error, info);
    reportLovableError(error, { boundary: "app_error_boundary" });
  }

  private reload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isProviderError = /must be used inside|Provider/i.test(error.message);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="surface w-full max-w-md p-6 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-lg font-bold text-ink">
            Medora hit an unexpected problem
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isProviderError
              ? "This part of the app lost access to your saved session data. Reloading usually restores it."
              : "Nothing you entered was sent anywhere. Reloading usually clears this."}
          </p>
          <p className="mt-3 rounded-md border border-border bg-secondary px-3 py-2 text-left font-mono text-xs text-muted-foreground">
            {error.message}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={this.reload}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="size-4" aria-hidden /> Reload
            </button>
            <a
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Go home
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            If this keeps happening, medicine information here is demo data —
            always confirm anything clinical with a pharmacist or doctor.
          </p>
        </div>
      </div>
    );
  }
}
