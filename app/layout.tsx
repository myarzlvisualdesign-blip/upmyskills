import type { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit, History, Home, LibraryBig, Settings, Sparkles } from "lucide-react";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "UpMySkills - Executable AI Skills Tools",
  description: "Turn Claude and AI skills repositories into executable web tools with forms, outputs, history, and templates."
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/tools", label: "Tools", icon: Sparkles },
  { href: "/domains/seo-geo", label: "Domains", icon: BrainCircuit },
  { href: "/history", label: "History", icon: History },
  { href: "/sources", label: "Sources", icon: LibraryBig },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col px-4 py-4 md:px-6">
          <header className="sticky top-3 z-40 mb-4 rounded-lg border bg-card/90 px-3 py-3 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="flex items-center gap-3 no-underline">
                <span className="grid size-10 place-items-center rounded-md bg-up-ink text-sm font-black text-up-cream">
                  U
                </span>
                <span>
                  <span className="block text-base font-black leading-none tracking-tight">UpMySkills</span>
                  <span className="text-xs font-medium text-muted-foreground">Executable AI skills workspace</span>
                </span>
              </Link>
              <nav className="flex gap-1 overflow-x-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
