import { NextResponse } from "next/server";

// Middleware intercepts this route, verifies the session, and refreshes the
// cookie — keeping the 1-hour inactivity timer alive while the user is writing.
export async function GET() {
  return NextResponse.json({ ok: true });
}
