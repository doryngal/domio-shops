import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Prisma, no Node.js-only modules.
// Used by middleware.ts (Edge Runtime) and extended by lib/auth.ts (Node.js).
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/shop/login",
  },
  // Providers are added in lib/auth.ts (Credentials uses Prisma → Node.js only)
  providers: [],
  callbacks: {
    authorized({ request, auth }) {
      const host       = request.headers.get("host") || "";
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "domio.top";
      const isShop     = host === `shop.${rootDomain}` || host === "shop.localhost";
      const isFounder  = host === `founder.${rootDomain}` || host === "founder.localhost";
      const isMainDomain = host === rootDomain || host === "localhost";
      const isStorefront = !isShop && !isFounder && !isMainDomain &&
                           (host.endsWith(`.${rootDomain}`) || host.endsWith(".localhost"));
      // Storefronts are public — always allow, our middleware handles the rewrite
      if (isStorefront) return true;
      // Everything else — our middleware handles auth checks, so allow here
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.userId   = user.id;
        token.role     = (user as { role?: string }).role;
        token.shopId   = (user as { shopId?: string }).shopId;
        token.shopSlug = (user as { shopSlug?: string }).shopSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id       = token.userId;
        u.role     = token.role;
        u.shopId   = token.shopId;
        u.shopSlug = token.shopSlug;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
