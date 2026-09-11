import type { NextConfig } from "next";

const supabaseOrigin = (() => {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Prefer modern formats for Supabase-hosted photos while keeping the
    // existing public storage URL as the source of truth.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: supabaseOrigin
      ? [
          {
            protocol: supabaseOrigin.protocol.replace(":", "") as
              "http" | "https",
            hostname: supabaseOrigin.hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
