"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "alphatradex-cookie-consent";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const persistChoice = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setExiting(true);
  };

  useEffect(() => {
    if (!exiting) return;
    const id = window.setTimeout(() => setShow(false), 320);
    return () => window.clearTimeout(id);
  }, [exiting]);

  if (!mounted || !show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookies"
      className={`fixed bottom-4 left-6 z-[100] max-w-[425px] rounded-[12px] border border-[#1E2035] bg-[#12121A] p-4 transition-opacity duration-300 ease-out ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <p className="text-center whitespace-nowrap text-sm" style={{ color: "#8892AA" }}>
        Nous utilisons les{" "}
        <Link href="/legal/cookies" className="underline underline-offset-2 hover:opacity-90">
          cookies
        </Link>{" "}
        pour améliorer votre expérience.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => persistChoice("accepted")}
          className="rounded-[12px] px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#2D6FFF" }}
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => persistChoice("rejected")}
          className="rounded-[12px] border bg-transparent px-3 py-2.5 text-sm font-semibold transition-colors hover:opacity-90"
          style={{ borderColor: "#1E2035", color: "#8892AA" }}
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
