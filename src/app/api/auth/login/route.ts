import { NextRequest, NextResponse } from "next/server";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function createSession(secret: string): Promise<string> {
  const payload = { auth: true, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const data = btoa(JSON.stringify(payload));
  const key = await getKey(secret);
  const encoder = new TextEncoder();
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
  return `${data}.${sig}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = body.password;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const expectedPassword = process.env.AUTH_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!expectedPassword || !sessionSecret) {
    // Auth not configured, skip (local dev without .env)
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", "local-dev-bypass", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  }

  if (password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const sessionToken = await createSession(sessionSecret);

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", sessionToken, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
