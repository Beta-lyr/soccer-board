import { createCrudHandler } from "../_helpers";
const handler = createCrudHandler("teams");

export async function onRequest(context: { request: Request; env: any; params: { id: string } }) {
  const { request, env, params } = context;
  const id = params.id;

  switch (request.method) {
    case "GET": return handler.getOne(env, id);
    case "PUT": return handler.updateOne(env, id, await request.json());
    case "DELETE": return handler.deleteOne(env, id);
    default: return new Response("Method not allowed", { status: 405 });
  }
}
