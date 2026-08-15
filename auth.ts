import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/auth.config";

// For client components: signIn and signOut
const nextAuthResult = NextAuth({
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

// For server components: auth() function that uses getServerSession
export const auth = () => getServerSession(authConfig);

export const signIn = nextAuthResult.signIn;
export const signOut = nextAuthResult.signOut;
// No need to export handlers since we have them in the route file
