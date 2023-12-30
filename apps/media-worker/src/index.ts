export interface Env {
  BUCKET: R2Bucket;
  AUTH_SECRET: string;
}

function isAuthorized(request: Request, env: Env) {
  const auth = request.headers.get("Authorization");
  const expectedAuth = `Bearer ${env.AUTH_SECRET}`;

  return auth && auth === expectedAuth;
}

function authorizeRequest(request: Request, env: Env) {
  switch (request.method) {
    case "PUT":
    case "DELETE":
      return isAuthorized(request, env);
    case "GET":
      return true;
    default:
      return false;
  }
}

export default {
  async fetch(request: Request, env: Env, _: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!authorizeRequest(request, env)) {
      return new Response("Forbidden", { status: 403 });
    }

    switch (request.method) {
      case "PUT":
        const formData = await request.formData();
        const file = formData.get("file");
        await env.BUCKET.put(key, file);
        return new Response(`Object ${key} uploaded successfully!`);
      case "GET":
        const object = await env.BUCKET.get(key);

        if (object === null) {
          return new Response("Object Not Found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      case "DELETE":
        await env.BUCKET.delete(key);
        return new Response("Deleted!");
      default:
        return new Response("Method not allowed", {
          status: 405,
          headers: {
            Allow: "PUT, GET, DELETE",
          },
        });
    }
  },
};
