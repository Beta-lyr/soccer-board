interface Env {
  AVATAR_BUCKET: R2Bucket;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key || !key.startsWith("avatars/")) {
    return new Response("Missing or invalid key", { status: 400 });
  }

  if (!env.AVATAR_BUCKET) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const object = await env.AVATAR_BUCKET.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  const contentType = object.httpMetadata?.contentType || "application/octet-stream";
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
