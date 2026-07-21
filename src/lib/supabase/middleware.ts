import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl, getSupabaseAnonKey } from "./env";

const PUBLIC_PATHS = ["/login", "/register", "/auth"];
const AUTH_CALLBACK_PATH = "/auth/callback";
const ONBOARDING_PATH = "/onboarding";
const PROTECTED_APP_PREFIXES = [
  "/nyx",
  "/dashboard",
  "/planejamento",
  "/profile",
  "/transactions",
  "/categories",
  "/loja",
  "/jornada",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";
}

function isProtectedApp(pathname: string): boolean {
  return PROTECTED_APP_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const { pathname } = request.nextUrl;

  if (!url || !key) {
    // Sem config: não deixa entrar na área autenticada
    if (isProtectedApp(pathname) || pathname.startsWith(ONBOARDING_PATH)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("gate", "1");
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getClaims();

  if (pathname.startsWith(AUTH_CALLBACK_PATH)) {
    return response;
  }

  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data?.user;

  if (!isLoggedIn && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("gate", "1");
    if (pathname && pathname !== "/login") {
      redirectUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoggedIn && data.user) {
    let onboardingDone = false;
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profileError) {
      onboardingDone = profileRow?.onboarding_completed === true;
    }

    if (pathname.startsWith(ONBOARDING_PATH) && onboardingDone) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/planejamento";
      return NextResponse.redirect(redirectUrl);
    }

    if (!onboardingDone && isProtectedApp(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ONBOARDING_PATH;
      return NextResponse.redirect(redirectUrl);
    }

    if (pathname === "/login" || pathname === "/register") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = onboardingDone ? "/nyx" : ONBOARDING_PATH;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
