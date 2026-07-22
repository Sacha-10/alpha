"use client";

import NextTopLoader from "nextjs-toploader";
import { theme } from "@/styles/theme";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    opt_out_capturing_by_default: true,
  });
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      const qs = searchParams.toString();
      if (qs) url += "?" + qs;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (localStorage.getItem("alphatradex-cookie-consent") === "accepted") {
      posthog.opt_in_capturing();
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <NextTopLoader
        color={theme.colors.accentBlue}
        height={3}
        shadow="0 0 12px rgba(var(--blue-rgb), 0.35)"
        speed={250}
        showSpinner={false}
      />
      {children}
    </PostHogProvider>
  );
}
