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

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json(
      { error: "Expected multipart/form-data" },
      { status: 400, headers }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return Response.json(
      { error: "No file provided" },
      { status: 400, headers }
    );
  }

  const imageFile = file as File;

  if (imageFile.size === 0) {
    return Response.json(
      { error: "Empty file" },
      { status: 400, headers }
    );
  }

  const fileType = imageFile.type || "image/jpeg";
  if (!ALLOWED_TYPES.includes(fileType)) {
    return Response.json(
      { error: `Invalid file type: ${fileType}. Allowed: JPEG, PNG, WebP, GIF` },
      { status: 400, headers }
    );
  }

  if (imageFile.size > MAX_SIZE) {
    return Response.json(
      { error: `File too large: ${(imageFile.size / 1024 / 1024).toFixed(1)}MB. Max: 2MB` },
      { status: 400, headers }
    );
  }

  const ext = fileType.split("/")[1] || "jpg";
  const key = `avatars/${crypto.randomUUID()}.${ext}`;

  await env.AVATAR_BUCKET.put(key, imageFile, {
    httpMetadata: {
      contentType: imageFile.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  // Return key; client uses /api/avatar/serve?key=... to load image
  return Response.json({ key }, { headers });
}
