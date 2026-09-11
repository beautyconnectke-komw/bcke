import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/database";
import { AuthenticationRequiredError } from "./errors";

type BeautyConnectClient = SupabaseClient<Database, "public">;

export type AuthContext = {
  supabase: BeautyConnectClient;
  userId: string;
  profile: Pick<Tables<"profiles">, "id" | "role" | "display_name"> | null;
};

const authProfileSelect = "id, role, display_name";

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const userId = claims?.sub;
  if (claimsError || typeof userId !== "string") {
    throw new AuthenticationRequiredError();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(authProfileSelect)
    .eq("id", userId)
    .maybeSingle();

  return {
    supabase,
    userId,
    profile,
  };
});

export async function getOptionalAuthContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const userId = claims?.sub;
  if (typeof userId !== "string") return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(authProfileSelect)
    .eq("id", userId)
    .maybeSingle();

  return { supabase, userId, profile };
}
