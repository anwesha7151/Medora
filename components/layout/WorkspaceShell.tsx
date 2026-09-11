import { Link } from "@tanstack/react-router";
import { LogOut, Menu, Search, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/common/primitives";
import { ThemeToggle } from "@/lib/theme";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import type { NavItem } from "./nav-config";
import { useSignOut } from "@/lib/use-sign-out";

function WorkspaceNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: (() => void) | undefined;
}) {
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav className="space-y-6" aria-label="Workspace">
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
                    activeOptions={{ exact: item.to.split("/").length === 2 }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
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

export function WorkspaceShell({
  workspace,
  items,
  children,
}: {
  workspace: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const { open, setOpen } = useCommandPalette();
  const [mobileNav, setMobileNav] = useState(false);
  const signOut = useSignOut();

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={open} onOpenChange={setOpen} />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Link to="/" aria-label="Medora home">
            <Logo />
          </Link>
        </div>
        <div className="px-5 pb-3 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {workspace} workspace
          </p>
        </div>
        <ScrollArea className="flex-1 px-2 pb-5">
          <WorkspaceNav items={items} />
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
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
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
                    <WorkspaceNav
                      items={items}
                      onNavigate={() => setMobileNav(false)}
                    />
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Link to="/" className="lg:hidden" aria-label="Medora home">
                <Logo compact />
              </Link>
            </div>

            {/* Expanded Search Trigger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="hidden sm:flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-input bg-card px-3 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-card/90 shadow-2xs"
            >
              <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="truncate">
                Search commands, records, or inventory…
              </span>
              <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium font-mono sm:block">
                ⌘K
              </kbd>
            </button>

            {/* Right-aligned Header Actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Search"
                onClick={() => setOpen(true)}
              >
                <Search className="size-5" aria-hidden />
              </Button>
              <ThemeToggle showMenu />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
              >
                <Link to="/switch">
                  <SlidersHorizontal className="size-3.5" aria-hidden /> Switch
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive-soft"
              >
                <LogOut className="size-3.5" aria-hidden /> Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1220px] px-4 pb-16 pt-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
