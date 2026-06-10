async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function verifySession(token: string, secret: string): Promise<boolean> {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return false;
    const key = await getKey(secret);
    const encoder = new TextEncoder();
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
    if (!valid) return false;
    const payload = JSON.parse(atob(data));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function onRequest(context: any) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip auth for login page, API auth routes, and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/avatar") ||
    pathname.match(/\.\w+$/)
  ) {
    return next();
  }

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const token = match?.[1];

  const secret = env.SESSION_SECRET;
  if (!secret) return next(); // not configured, skip auth
  if (token && await verifySession(token, secret)) {
    return next();
  }

  // API requests get 401
  if (pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Page requests redirect to login
  const returnTo = encodeURIComponent(pathname + url.search);
  return Response.redirect(`${url.origin}/login/?returnTo=${returnTo}`, 302);
}
