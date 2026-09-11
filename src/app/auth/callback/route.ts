import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/select-role";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      return NextResponse.redirect(
        new URL(
          nextPath === "/select-role" ? "/admin/dashboard" : nextPath,
          requestUrl.origin,
        ),
      );
    }

    if (profile?.role === "worker") {
      const { data: worker } = await supabase
        .from("worker_profiles")
        .select("verification_status")
        .eq("profile_id", user.id)
        .maybeSingle();

      const destination = !worker
        ? "/worker/onboarding"
        : worker.verification_status === "approved"
          ? "/worker/home"
          : "/worker/status";

      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }

    if (profile?.role === "employer") {
      const { data: employer } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();

      return NextResponse.redirect(
        new URL(
          employer ? "/employer/home" : "/employer/onboarding",
          requestUrl.origin,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
