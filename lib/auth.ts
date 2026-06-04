import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.shopUser.findUnique({
          where:   { email: credentials.email as string },
          include: { shop: true },
        });

        if (!user) return null;

        const ok = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!ok) return null;

        await prisma.shopUser.update({
          where: { id: user.id },
          data:  { last_login_at: new Date() },
        });

        return {
          id:       user.id,
          email:    user.email,
          role:     user.role,
          shopId:   user.shop_id,
          shopSlug: user.shop.slug,
        };
      },
    }),
  ],
});
