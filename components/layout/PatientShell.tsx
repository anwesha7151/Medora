import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { useSignOut } from "@/lib/use-sign-out";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/primitives";
import { ThemeToggle } from "@/lib/theme";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { patientBottomNav, patientNav, type NavItem } from "./nav-config";

function NavList({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: (() => void) | undefined;
}) {
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav className="space-y-6" aria-label="Main">
      {groups.map((group) => (
        <div key={group}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group}
          </p>
          <ul className="space-y-0.5">
            {items
              .filter((i) => i.group === group)
              .map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to as "/app"}
                    onClick={onNavigate}
                    activeOptions={{ exact: item.to === "/app" }}
                    className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
                  >
                    <item.icon
                      className="size-4 shrink-0 opacity-80"
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PatientShell({ children }: { children: ReactNode }) {
  const { state, markAllNotificationsRead } = useStore();
  const signOut = useSignOut();
  const { profile, user, primaryRole } = useAuth();
  const { open, setOpen } = useCommandPalette();
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = state.notifications.filter((n) => !n.read).length;
  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0);

  // Background check for scheduled medications
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${hours}:${minutes}`;

      state.reminders.forEach((reminder) => {
        if (!reminder.active) return;

        if (reminder.times.includes(currentTimeStr)) {
          const today = now.toISOString().slice(0, 10);
          const hasLoggedToday = reminder.log.some(
            (l) => l.date === today && l.time === currentTimeStr,
          );

          if (!hasLoggedToday) {
            toast.info(`Time to take ${reminder.medicineName}`, {
              description: `Dosage: ${reminder.strength} — ${reminder.instruction}`,
              duration: 20000,
              icon: <Bell className="size-4 text-primary" />,
            });
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [state.reminders]);

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={open} onOpenChange={setOpen} />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link to="/app" aria-label="Medora home">
            <Logo />
          </Link>
        </div>
        <ScrollArea className="flex-1 px-2 py-5">
          <NavList items={patientNav} />
        </ScrollArea>
        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/switch"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden /> Switch
            workspace
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={mobileNav} onOpenChange={setMobileNav}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="border-b border-border px-5 py-4">
                  <SheetTitle className="text-left">
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-72px)] px-2 py-5">
                  <NavList
                    items={patientNav}
                    onNavigate={() => setMobileNav(false)}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link to="/app" className="lg:hidden" aria-label="Medora home">
              <Logo compact />
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Search medicines, pharmacies and records"
              className="ml-auto hidden h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong sm:flex sm:max-w-md lg:ml-0"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                Search medicines, pharmacies, records…
              </span>
              <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium sm:block">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
              <ThemeToggle showMenu />
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Search"
                onClick={() => setOpen(true)}
              >
                <Search className="size-5" aria-hidden />
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Cart"
              >
                <Link to="/app/cart">
                  <ShoppingBag className="size-5" aria-hidden />
                  {cartCount > 0 && (
                    <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              >
                <Link
                  to="/app/notifications"
                  onClick={() =>
                    window.setTimeout(markAllNotificationsRead, 1200)
                  }
                >
                  <Bell className="size-5" aria-hidden />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary uppercase">
                      {(profile?.full_name ?? state.profile.fullName).slice(
                        0,
                        1,
                      )}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-semibold">
                      {profile?.full_name ?? state.profile.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email ?? state.profile.email}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {primaryRole ?? "patient"} account
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/settings">
                      <User className="size-4" aria-hidden /> Profile & settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/switch">
                      <SlidersHorizontal className="size-4" aria-hidden />{" "}
                      Switch workspace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()}>
                    <LogOut className="size-4" aria-hidden /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1220px] px-4 pb-28 pt-6 sm:px-6 lg:pb-14">
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-6">
          {patientBottomNav.map((item) => {
            const active =
              item.to === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to as "/app"}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" aria-hidden />
                  {(item.label || "").split(" ")[0]}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            >
              <Menu className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
