import NextAuth, { type NextAuthRequest } from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Edge-compatible: only authConfig (no Prisma)
const { auth } = NextAuth(authConfig);

export default auth(async function middleware(request: NextAuthRequest) {
  const hostname = request.headers.get("host") || "";
  const url      = request.nextUrl.clone();
  const pathname = url.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const host    = hostname.split(":")[0];
  const session = request.auth;
  const role    = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;

  // ── Resolve subdomain ──────────────────────────────────────────────
  let subdomain = "";
  if (host === "shop.domio.top"    || host === "shop.localhost")    subdomain = "shop";
  else if (host === "founder.domio.top" || host === "founder.localhost") subdomain = "founder";
  else if (host.endsWith(".domio.top")) subdomain = host.replace(".domio.top", "");
  else if (host.endsWith(".localhost"))  subdomain = host.replace(".localhost", "");

  // ── Shop portal ────────────────────────────────────────────────────
  if (subdomain === "shop") {
    // founder landed here after login redirect — let it through
    if (pathname.startsWith("/founder/")) {
      return NextResponse.next();
    }
    if (!pathname.startsWith("/shop/login") && !pathname.startsWith("/api/")) {
      if (!session) {
        url.pathname = "/shop/login";
        return NextResponse.redirect(url);
      }
      // founder logged in via shop login → redirect to founder dashboard
      if (role === "founder") {
        url.pathname = "/founder/dashboard";
        return NextResponse.redirect(url);
      }
      if (role !== "shop_owner" && role !== "shop_staff") {
        url.pathname = "/shop/login";
        return NextResponse.redirect(url);
      }
    }
    if (!pathname.startsWith("/shop") && !pathname.startsWith("/api/")) {
      url.pathname = `/shop${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Founder portal ─────────────────────────────────────────────────
  if (subdomain === "founder") {
    if (!pathname.startsWith("/founder/login") && !pathname.startsWith("/api/")) {
      if (!session || role !== "founder") {
        url.pathname = "/founder/login";
        return NextResponse.redirect(url);
      }
    }
    if (!pathname.startsWith("/founder") && !pathname.startsWith("/api/")) {
      url.pathname = `/founder${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Storefront subdomain ───────────────────────────────────────────
  if (subdomain && subdomain !== "www") {
    if (!pathname.startsWith("/storefront") && !pathname.startsWith("/api/")) {
      url.pathname = `/storefront/${subdomain}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ── Main domain: protect dashboard routes ─────────────────────────
  if (pathname.startsWith("/shop/dashboard")) {
    if (!session || (role !== "shop_owner" && role !== "shop_staff")) {
      url.pathname = "/shop/login";
      return NextResponse.redirect(url);
    }
  }
  if (pathname.startsWith("/founder/dashboard")) {
    if (!session || role !== "founder") {
      url.pathname = "/founder/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
