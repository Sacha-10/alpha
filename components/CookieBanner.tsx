"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "alphatradex-cookie-consent";

// Module-level flag: survives client-side navigations (component remounts)
// but resets on full page reload — complementary to localStorage.
let _sessionDismissed = false;

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [acceptHover, setAcceptHover] = useState(false);
  const [rejectHover, setRejectHover] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (_sessionDismissed) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const persistChoice = (value: "accepted" | "rejected") => {
    _sessionDismissed = true;
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

  return createPortal(
    <div
      role="dialog"
      aria-label="Cookies"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(420px, calc(100% - 2rem))",
        backgroundColor: "#12121A",
        border: "1px solid #1E2035",
        borderRadius: "12px",
        padding: "12px",
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transition: "opacity 300ms ease-out",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      <p
        style={{
          textAlign: "center",
          whiteSpace: "nowrap",
          fontSize: "0.75rem",
          lineHeight: "1.25rem",
          color: "#8892AA",
          margin: 0,
        }}
      >
        Nous utilisons les{" "}
        <Link
          href="/legal/cookies"
          style={{
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            color: "inherit",
          }}
        >
          cookies
        </Link>{" "}
        pour améliorer votre expérience.
      </p>
      <div
        style={{
          marginTop: "0.625rem",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "0.625rem",
        }}
      >
        <button
          type="button"
          onClick={() => persistChoice("accepted")}
          onMouseEnter={() => setAcceptHover(true)}
          onMouseLeave={() => setAcceptHover(false)}
          style={{
            borderRadius: "12px",
            border: "none",
            padding: "8px 16px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#FFFFFF",
            backgroundColor: "#2D6FFF",
            cursor: "pointer",
            opacity: acceptHover ? 0.9 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => persistChoice("rejected")}
          onMouseEnter={() => setRejectHover(true)}
          onMouseLeave={() => setRejectHover(false)}
          style={{
            borderRadius: "12px",
            border: "1px solid #1E2035",
            padding: "8px 16px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#8892AA",
            backgroundColor: "transparent",
            cursor: "pointer",
            opacity: rejectHover ? 0.9 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          Refuser
        </button>
      </div>
    </div>,
    document.body
  );
}
