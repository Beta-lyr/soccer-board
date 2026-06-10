import { createCrudHandler } from "../_helpers";
const handler = createCrudHandler("teams", ["createdAt"]);
export const onRequestGet = handler.onRequestGet;
export const onRequestPost = handler.onRequestPost;
