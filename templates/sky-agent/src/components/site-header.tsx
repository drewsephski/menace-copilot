"use client";

import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { SkyAgentLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <>
      <header className="sticky z-50 flex justify-center transition-all duration-300 md:mx-0 top-4 mx-0">
        <div style={{ width: "70rem" }} className="w-full max-w-7xl px-4">
          <div className="mx-auto max-w-7xl rounded-2xl transition-all duration-300 xl:px-0 shadow-none px-3 md:px-7 bg-background/80 backdrop-blur-md border border-border/60">
            <div className="flex h-[56px] items-center justify-between p-4">
              <Link className="flex items-center gap-3" href="/">
                <SkyAgentLogo className="size-7 md:size-10" />
                <p className="text-lg font-semibold text-primary">SkyAgent</p>
              </Link>

              <div className="w-full hidden md:block">
                <ul className="relative mx-auto flex w-fit rounded-full h-11 px-2 items-center justify-center">
                  {navLinks.map((link) => (
                    <li
                      key={link.href}
                      className={cn(
                        "z-10 cursor-pointer h-full flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 tracking-tight",
                        "active" in link && link.active
                          ? "text-primary"
                          : "text-primary/60 hover:text-primary",
                      )}
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
                <div className="flex items-center space-x-6">
                  <Link
                    className="bg-secondary h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
                    href="#"
                  >
                    Try for free
                  </Link>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="cursor-pointer rounded-full h-8 w-8 relative"
                  onClick={handleToggleTheme}
                  aria-label="Toggle theme"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
                  <span className="sr-only">Toggle theme</span>
                </Button>

                <button
                  type="button"
                  className="md:hidden border border-border size-8 rounded-md cursor-pointer flex items-center justify-center"
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((open) => !open)}
                >
                  {mobileOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {mounted && mobileOpen ? (
        <div className="md:hidden fixed inset-x-0 top-20 z-40 px-6">
          <div className="rounded-2xl border border-border bg-background shadow-lg p-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#"
              className="mt-2 bg-secondary h-9 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground px-4"
              onClick={() => setMobileOpen(false)}
            >
              Try for free
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
