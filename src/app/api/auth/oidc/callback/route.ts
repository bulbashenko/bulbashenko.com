import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/auth";
import { ADMIN_GROUP, finishLogin, FLOW_COOKIE_NAME, FLOW_COOKIE_PATH, siteUrl } from "@/lib/oidc";

function back(error: string) {
  const res = NextResponse.redirect(siteUrl(`/admin/login?error=${error}`));
  res.cookies.set(FLOW_COOKIE_NAME, "", { maxAge: 0, path: FLOW_COOKIE_PATH });
  return res;
}

export async function GET(req: NextRequest) {
  const flowToken = req.cookies.get(FLOW_COOKIE_NAME)?.value;
  if (!flowToken) return back("expired");
  // The provider refuses users outside the client's group itself (access_denied).
  const providerError = req.nextUrl.searchParams.get("error");
  if (providerError) return back(providerError === "access_denied" ? "forbidden" : "denied");

  let user;
  try {
    user = await finishLogin(req.nextUrl.search, flowToken);
  } catch (err) {
    console.error("OIDC callback failed:", err);
    return back("failed");
  }
  if (!user.groups.includes(ADMIN_GROUP)) {
    console.warn(`OIDC login refused for ${user.username}: not in ${ADMIN_GROUP}`);
    return back("forbidden");
  }

  const res = NextResponse.redirect(siteUrl("/admin"));
  res.cookies.set(FLOW_COOKIE_NAME, "", { maxAge: 0, path: FLOW_COOKIE_PATH });
  await startSession(req, res);
  return res;
}
