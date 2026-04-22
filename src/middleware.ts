import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "bul_session";
const JWT_ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret(), { algorithms: [JWT_ALG] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin/* except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!(await isAuthenticated(req))) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/* except /api/auth/login and public GET endpoints
  if (pathname.startsWith("/api/")) {
    const isAuthEndpoint = pathname === "/api/auth/login";
    const isPublicGet =
      req.method === "GET" &&
      (pathname.startsWith("/api/posts") ||
        pathname.startsWith("/api/projects") ||
        pathname.startsWith("/api/profile") ||
        pathname.startsWith("/api/cv") ||
        pathname.startsWith("/api/gallery"));

    if (!isAuthEndpoint && !isPublicGet) {
      if (!(await isAuthenticated(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
