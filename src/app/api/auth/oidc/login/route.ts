import { NextResponse } from "next/server";
import { beginLogin, FLOW_COOKIE_MAX_AGE, FLOW_COOKIE_NAME, FLOW_COOKIE_PATH, siteUrl } from "@/lib/oidc";

// Sends the browser to the SSO provider. The flow cookie comes back on the callback (same site, top-level navigation).
export async function GET() {
  try {
    const { url, flowToken } = await beginLogin();
    const res = NextResponse.redirect(url);
    res.cookies.set(FLOW_COOKIE_NAME, flowToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: FLOW_COOKIE_PATH,
      maxAge: FLOW_COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("OIDC login start failed:", err);
    return NextResponse.redirect(siteUrl("/admin/login?error=unavailable"));
  }
}
