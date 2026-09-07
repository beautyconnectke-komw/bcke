const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const env = {
  supabase: {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
    isConfigured: Boolean(supabaseUrl && supabasePublishableKey),
  },
};

export function getSupabaseConfig() {
  if (!env.supabase.url || !env.supabase.publishableKey) {
    throw new Error(
      "Missing Supabase environment configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  return {
    url: env.supabase.url,
    publishableKey: env.supabase.publishableKey,
  };
}
