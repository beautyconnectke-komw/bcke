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
  profile: Tables<"profiles"> | null;
};

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthenticationRequiredError();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    userId: user.id,
    profile,
  };
});

export async function getOptionalAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, userId: user.id, profile };
}
