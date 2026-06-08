"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Package, Search, ClipboardList, User, Menu, X, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { ThemeToggle } from "~/components/shared/theme-toggle";

const navLinks = [
  { title: "Track Shipment", href: "/portal/track", icon: Search },
  { title: "My Shipments", href: "/portal/shipments", icon: ClipboardList },
  { title: "Profile", href: "/portal/profile", icon: User },
];

export function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false });

  const signOutMutation = trpc.customerAuth.signOut.useMutation({
    onSuccess: () => {
      router.push("/login/customer");
    },
  });

  const isPortalPage = pathname.startsWith("/portal");

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/portal/track" className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-semibold">TPC India</span>
        </Link>

        {isPortalPage && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.title}
                </Button>
              </Link>
            ))}
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => signOutMutation.mutate(undefined)}
                disabled={signOutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </nav>
        )}

        {isPortalPage && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {mobileOpen && isPortalPage && (
        <div className="border-t px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
            >
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  pathname === link.href
                    ? "bg-secondary font-medium"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.title}
              </div>
            </Link>
          ))}
          {user && (
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={() => {
                setMobileOpen(false);
                signOutMutation.mutate(undefined);
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
