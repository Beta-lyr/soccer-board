import { createCrudHandler } from "../_helpers";
const handler = createCrudHandler("lineup_templates", ["createdAt"]);
export const onRequestGet = handler.onRequestGet;
export const onRequestPost = handler.onRequestPost;
