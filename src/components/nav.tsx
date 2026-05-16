"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Package, Gift, CalendarDays, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/people", label: "People", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/gifts", label: "Gifts", icon: Gift },
  { href: "/holidays", label: "Holidays", icon: Star },
  { href: "/occasions", label: "Occasions", icon: CalendarDays },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center h-14 gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary shrink-0">
            <span className="text-2xl">🎁</span>
            <span className="text-lg tracking-tight">Giftify</span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
