"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, BarChart3, Map, Users, TrendingUp } from "lucide-react";

const links = [
  { href: "/", label: "Screener", icon: Building2 },
  { href: "/compare", label: "Compare", icon: BarChart3 },
  { href: "/map", label: "Branch Map", icon: Map },
  { href: "/credit-unions", label: "Credit Unions", icon: Users },
  { href: "/mutual-tracker", label: "Mutual Tracker", icon: TrendingUp },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex items-center gap-1 h-14">
        <Link href="/" className="font-semibold text-sm mr-4 text-foreground">
          BankScreener
        </Link>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
