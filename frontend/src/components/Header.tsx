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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/classes" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight text-foreground">SchoolAdmit</h1>
            <p className="text-[10px] leading-none text-muted-foreground">Online Admission System</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname?.startsWith(href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* BRN Input */}
        <BrnInput />
      </div>
    </header>
  );
}

