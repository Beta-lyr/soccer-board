import { createCrudHandler } from "../_helpers";
const handler = createCrudHandler("tactics", ["createdAt"]);
export const onRequestGet = handler.onRequestGet;
export const onRequestPost = handler.onRequestPost;
