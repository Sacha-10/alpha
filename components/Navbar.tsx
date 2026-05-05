"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, UserCircle, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const LogoSvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 600 600"
    style={{ borderRadius: "8px", flexShrink: 0 }}
    aria-hidden
  >
    <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F" />
    <svg
      x="75"
      y="75"
      width="450"
      height="450"
      viewBox="0 0 24 24"
      fill="#0A0A0F"
      stroke="#2D6FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    []
  );
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const connectGoogle = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [mobileOpen]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const closeMobileMenu = () => setMobileOpen(false);

  const scrollTopSmooth = () => window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  const handleBrandClick = () => {
    if (pathname === "/") scrollTopSmooth();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b px-6 backdrop-blur-md transition-all duration-300 ${
        scrolled ? "border-border bg-background" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between py-4">
        <Link
          href="/"
          onClick={handleBrandClick}
          className="flex items-center gap-2 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          aria-label="AlphaTradeX — retour en haut"
        >
          <LogoSvg />
          <span className="hidden text-lg font-bold text-primary md:inline">AlphaTradeX</span>
        </Link>
        <Link
          href="/"
          onClick={handleBrandClick}
          className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-primary md:hidden"
        >
          AlphaTradeX
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link href="/analysis" className="text-secondary transition-colors duration-200 hover:text-primary">
            Analyse
          </Link>
          <Link href="/pricing" className="text-secondary transition-colors duration-200 hover:text-primary">
            Prix
          </Link>
          <Link href="/about" className="text-secondary transition-colors duration-200 hover:text-primary">
            À propos
          </Link>
          <Link href="/help" className="text-secondary transition-colors duration-200 hover:text-primary">
            Aide
          </Link>
        </nav>

        {user ? (
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="hidden items-center gap-2 rounded bg-blue px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-blue/90 md:inline-flex"
          >
            <UserCircle className="h-4 w-4" aria-hidden />
            Déconnexion
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void connectGoogle()}
            className="hidden items-center gap-2 rounded bg-blue px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-blue/90 md:inline-flex"
          >
            <UserCircle className="h-4 w-4" aria-hidden />
            S&apos;inscrire
          </button>
        )}

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="rounded border border-border bg-card p-2 text-secondary md:hidden"
          aria-label={mobileOpen ? "Fermer menu" : "Ouvrir menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <div
        ref={mobileMenuRef}
        className={`mx-4 overflow-hidden rounded border border-border bg-card transition-all duration-200 ease-out md:hidden ${
          mobileOpen ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-2 p-4">
          <Link href="/analysis" onClick={closeMobileMenu} className="text-left text-secondary transition-colors duration-200 hover:text-primary">
            Analyse
          </Link>
          <Link href="/pricing" onClick={closeMobileMenu} className="text-left text-secondary transition-colors duration-200 hover:text-primary">
            Prix
          </Link>
          <Link href="/about" onClick={closeMobileMenu} className="text-left text-secondary transition-colors duration-200 hover:text-primary">
            À propos
          </Link>
          <Link href="/help" onClick={closeMobileMenu} className="text-left text-secondary transition-colors duration-200 hover:text-primary">
            Aide
          </Link>
          {user ? (
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void supabase.auth.signOut();
              }}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded bg-blue px-4 py-2 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
            >
              <UserCircle className="h-4 w-4" aria-hidden />
              Déconnexion
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void connectGoogle();
              }}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded bg-blue px-4 py-2 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
            >
              <UserCircle className="h-4 w-4" aria-hidden />
              S&apos;inscrire
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
