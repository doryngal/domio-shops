import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const host       = hostname.split(":")[0];
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "domio.top";

  // ── Resolve subdomain ──────────────────────────────────────────────
  const isShop     = host === `shop.${rootDomain}` || host === "shop.localhost";
  const isFounder  = host === `founder.${rootDomain}` || host === "founder.localhost";
  const isMain     = host === rootDomain || host === "localhost" || host.startsWith("localhost:");
  const isStorefront = !isShop && !isFounder && !isMain &&
                       (host.endsWith(`.${rootDomain}`) || host.endsWith(".localhost"));

  // ── Storefront: fully public, just rewrite ─────────────────────────
  if (isStorefront) {
    const slug = host.endsWith(`.${rootDomain}`)
      ? host.replace(`.${rootDomain}`, "")
      : host.replace(/\.localhost(:\d+)?$/, "");
    if (slug && slug !== "www") {
      const url = request.nextUrl.clone();
      if (pathname.startsWith("/api/")) {
        // Rewrite /api/storefront/events/view → /api/storefront/{slug}/events/view
        // But if it already contains the slug, pass through as-is
        if (!pathname.startsWith(`/api/storefront/${slug}`)) {
          url.pathname = pathname.replace("/api/", `/api/storefront/${slug}/`);
        }
      } else {
        url.pathname = `/storefront/${slug}${pathname === "/" ? "" : pathname}`;
      }
      return NextResponse.rewrite(url);
    }
  }

  // ── Shop / Founder portals need auth ──────────────────────────────
  if (isShop || isFounder) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const role = token?.role as string | undefined;

    if (isShop) {
      if (pathname.startsWith("/founder/")) return NextResponse.next();

      if (!pathname.startsWith("/shop/login") && !pathname.startsWith("/api/")) {
        if (!token) {
          const url = request.nextUrl.clone();
          url.pathname = "/shop/login";
          return NextResponse.redirect(url);
        }
        if (role === "founder") {
          const url = request.nextUrl.clone();
          url.pathname = "/founder/dashboard";
          return NextResponse.redirect(url);
        }
        if (role !== "shop_owner" && role !== "shop_staff") {
          const url = request.nextUrl.clone();
          url.pathname = "/shop/login";
          return NextResponse.redirect(url);
        }
      }
      if (!pathname.startsWith("/shop") && !pathname.startsWith("/api/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/shop${pathname}`;
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
    }

    if (isFounder) {
      if (!pathname.startsWith("/founder/login") && !pathname.startsWith("/api/")) {
        if (!token || role !== "founder") {
          const url = request.nextUrl.clone();
          url.pathname = "/founder/login";
          return NextResponse.redirect(url);
        }
      }
      if (!pathname.startsWith("/founder") && !pathname.startsWith("/api/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/founder${pathname}`;
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
    }
  }

  // ── Main domain: protect dashboard routes ─────────────────────────
  if (
    pathname.startsWith("/shop/dashboard") ||
    pathname.startsWith("/founder/dashboard")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const role = token?.role as string | undefined;

    if (pathname.startsWith("/shop/dashboard")) {
      if (!token || (role !== "shop_owner" && role !== "shop_staff")) {
        const url = request.nextUrl.clone();
        url.pathname = "/shop/login";
        return NextResponse.redirect(url);
      }
    }
    if (pathname.startsWith("/founder/dashboard")) {
      if (!token || role !== "founder") {
        const url = request.nextUrl.clone();
        url.pathname = "/founder/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
