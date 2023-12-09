export interface Env {
  BUCKET: R2Bucket;
  AUTH_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, _: ExecutionContext): Promise<Response> {
    const auth = request.headers.get("Authorization");
    const expectedAuth = `Bearer ${env.AUTH_SECRET}`;

    if (!auth || auth !== expectedAuth) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    await env.BUCKET.put(key, request.body);
    return new Response(`Object ${key} uploaded successfully!`);
  },
};
