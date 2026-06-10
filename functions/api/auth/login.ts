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

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  const body = await request.json().catch(() => ({}));
  const password = body.password;

  if (!password || typeof password !== "string") {
    return Response.json({ error: "Password required" }, { status: 400 });
  }

  const expectedPassword = env.AUTH_PASSWORD;
  if (!expectedPassword) {
    return Response.json({ error: "Server not configured" }, { status: 500 });
  }

  if (password !== expectedPassword) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const secret = env.SESSION_SECRET;
  if (!secret) {
    return Response.json({ error: "Server not configured" }, { status: 500 });
  }
  const sessionToken = await createSession(secret);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
    },
  });
}
