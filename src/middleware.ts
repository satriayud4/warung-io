import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs on every request. Refreshes the Supabase auth session (so it never
// silently expires) and redirects unauthenticated users away from protected
// pages, and logged-in users away from the login/register pages.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Halaman yang hanya masuk akal saat BELUM login (kalau sudah login,
  // lempar ke dashboard).
  const isAuthOnlyPage = path === "/login" || path === "/register" || path === "/lupa-password";

  // /reset-password diakses lewat link dari email — sesi "recovery"-nya
  // baru terbentuk di sisi browser (dari token di URL), jadi halaman ini
  // harus selalu bisa diakses tanpa middleware ikut campur redirect.
  const isResetPasswordPage = path === "/reset-password";

  const isProtected = !isAuthOnlyPage && !isResetPasswordPage && path !== "/";

  if (!user && isProtected) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthOnlyPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
