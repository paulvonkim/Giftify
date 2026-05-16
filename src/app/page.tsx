"use client";

import Link from "next/link";
import { Users, Package, Gift, CalendarDays, Star, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getPersons, getGifts, getProducts, getOccasions } from "@/lib/storage";

export default function Home() {
  const [stats, setStats] = useState({ people: 0, gifts: 0, products: 0, occasions: 0 });

  useEffect(() => {
    setStats({
      people: getPersons().length,
      gifts: getGifts().length,
      products: getProducts().length,
      occasions: getOccasions().length,
    });
  }, []);

  const sections = [
    {
      href: "/people",
      icon: Users,
      label: "People",
      description: "Track who you gift to, grouped by household",
      count: stats.people,
      countLabel: "people",
      color: "bg-rose-50 text-rose-600",
    },
    {
      href: "/products",
      icon: Package,
      label: "Product Library",
      description: "Browse and manage your gift ideas",
      count: stats.products,
      countLabel: "products",
      color: "bg-amber-50 text-amber-600",
    },
    {
      href: "/gifts",
      icon: Gift,
      label: "Gifts",
      description: "Log gifts given, planned, or purchased",
      count: stats.gifts,
      countLabel: "gifts",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      href: "/holidays",
      icon: Star,
      label: "Holidays",
      description: "Manage recurring holidays and events",
      count: null,
      countLabel: "",
      color: "bg-purple-50 text-purple-600",
    },
    {
      href: "/occasions",
      icon: CalendarDays,
      label: "Occasions",
      description: "One-time events like birthdays and showers",
      count: stats.occasions,
      countLabel: "occasions",
      color: "bg-sky-50 text-sky-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="pt-4 text-center space-y-2">
        <div className="text-5xl">🎁</div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Giftify</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Never give the same gift twice. Keep a personal log of gifts, people, and occasions — all saved privately in your browser.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/people" className={buttonVariants()}>
            Get started <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link href="/gifts" className={buttonVariants({ variant: "outline" })}>
            Log a gift
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(({ href, icon: Icon, label, description, count, countLabel, color }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5 space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold group-hover:text-primary transition-colors">{label}</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
                {count !== null && (
                  <div className="text-xs text-muted-foreground">
                    {count} {countLabel}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
