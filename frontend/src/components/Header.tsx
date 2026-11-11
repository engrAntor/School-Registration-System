"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrnInput } from "@/components/BrnInput";
import { GraduationCap, BookOpen, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/my-applications", label: "My Applications", icon: ClipboardList },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/classes" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden xs:block sm:block">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight">SchoolAdmit</h1>
            <p className="text-[10px] leading-none text-muted-foreground hidden sm:block">Online Admission System</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors",
                pathname === href || pathname?.startsWith(href + "/")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* BRN Input */}
        <div className="shrink-0">
          <BrnInput />
        </div>
      </div>
    </header>
  );
}

