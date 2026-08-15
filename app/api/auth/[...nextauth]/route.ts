import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";

const handler = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const { getUserByEmail } = await import("@/lib/db");
        const { compare } = await import("bcryptjs");

        const user = getUserByEmail(email);
        if (!user) return null;

        const valid = await compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: null,
          role: user.role,
          membership: user.membership,
          balance: user.balance,
          permissions: user.permissions ?? "none",
        };
      },
    }),
  ],
});

export { handler as GET, handler as POST };
