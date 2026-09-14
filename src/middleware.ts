import { withAuth } from "next-auth/middleware";

// Everything under /dashboard requires an authenticated session.
// Fine-grained (per-jurisdiction) authorization happens in each API route
// and server component via src/lib/rbac.ts — middleware only gates entry.
export default withAuth({
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: ["/dashboard/:path*"]
};
