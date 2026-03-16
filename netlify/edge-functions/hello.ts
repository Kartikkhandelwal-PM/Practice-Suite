import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  return new Response("Hello from the Edge!", {
    headers: { "content-type": "text/html" },
  });
};

export const config = { path: "/edge-hello" };
