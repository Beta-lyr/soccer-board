interface Env {
  AVATAR_BUCKET: R2Bucket;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function onRequestOptions(context: { request: Request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(context.request.headers.get("Origin")),
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const origin = request.headers.get("Origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };

  if (!env.AVATAR_BUCKET) {
    return Response.json(
      { error: "R2 bucket not configured" },
      { status: 500, headers }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    data?: string;
    type?: string;
  } | null;

  if (!body?.data || !body?.type) {
    return Response.json(
      { error: "Missing data or type field" },
      { status: 400, headers }
    );
  }

  if (!ALLOWED_TYPES.includes(body.type)) {
    return Response.json(
      { error: `Invalid file type: ${body.type}. Allowed: JPEG, PNG, WebP, GIF` },
      { status: 400, headers }
    );
  }

  // Decode base64 to Uint8Array
  const base64Data = body.data.includes(",") ? body.data.split(",")[1] : body.data;
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  if (bytes.length === 0) {
    return Response.json(
      { error: "Empty file" },
      { status: 400, headers }
    );
  }

  if (bytes.length > MAX_SIZE) {
    return Response.json(
      { error: `File too large: ${(bytes.length / 1024 / 1024).toFixed(1)}MB. Max: 2MB` },
      { status: 400, headers }
    );
  }

  const ext = body.type.split("/")[1] || "jpg";
  const key = `soccer-board/avatars/${crypto.randomUUID()}.${ext}`;

  await env.AVATAR_BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType: body.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return Response.json({ key }, { headers });
}
