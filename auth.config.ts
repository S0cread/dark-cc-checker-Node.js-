import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.role = (user as { role?: string }).role ?? "user";
        token.membership = (user as { membership?: string }).membership ?? "free";
        token.balance = (user as { balance?: number }).balance ?? 0;
        token.permissions = (user as { permissions?: string }).permissions ?? "none";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        const u = session.user as unknown as Record<string, unknown>;
        u.role = token.role as string;
        u.membership = token.membership as string;
        u.balance = token.balance as number;
        u.permissions = token.permissions as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth;
      const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/kayit";
      const isPanelRoute = nextUrl.pathname.startsWith("/panel");
      
      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/panel", nextUrl));
        }
        return true;
      }
      
      if (isPanelRoute) {
        return isLoggedIn;
      }
      
      return true;
    },
  },
  providers: [],
  trustHost: true,
};
