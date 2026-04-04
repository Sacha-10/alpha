/** @type {import('next').NextConfig} */

const placeholderUrl = "https://build-placeholder.supabase.co";
const placeholderAnon =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.build-placeholder-signature";

const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || placeholderUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() ||
      placeholderAnon,
  },
};

export default nextConfig;
