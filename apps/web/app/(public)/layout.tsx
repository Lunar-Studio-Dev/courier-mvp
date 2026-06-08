"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Menu, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/shared/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "~/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/track", label: "Track Shipment" },
  { href: "/login", label: "Admin Portal" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col">
      {!isLogin && (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">TPC India</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={link.href === "/login" ? "default" : "ghost"}
                    size="sm"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              <ThemeToggle />
            </nav>

            {/* Mobile nav */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex items-center gap-2 mb-8 mt-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-bold">TPC India</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link href={link.href}>
                        <Button
                          variant={pathname === link.href ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          {link.label}
                        </Button>
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="pt-2 border-t">
                    <ThemeToggle />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
