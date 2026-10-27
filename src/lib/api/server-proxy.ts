import { randomUUID } from "node:crypto";
import { appBasePath } from "../routing/base-path";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
];

function copyRequestHeaders(source: Headers) {
  const headers = new Headers(source);
  const connectionTokens = headers.get("connection")?.split(",").map((value) => value.trim().toLowerCase()) ?? [];
  for (const name of [...HOP_BY_HOP_HEADERS, ...connectionTokens]) headers.delete(name);
  headers.set("accept-encoding", "identity");
  return headers;
}

function copyResponseHeaders(source: Headers) {
  const headers = new Headers(source);
  const connectionTokens = headers.get("connection")?.split(",").map((value) => value.trim().toLowerCase()) ?? [];
  for (const name of [...HOP_BY_HOP_HEADERS, ...connectionTokens, "content-encoding"]) headers.delete(name);

  // Preserve multiple Set-Cookie headers instead of folding them together.
  const cookies = typeof source.getSetCookie === "function" ? source.getSetCookie() : [];
  if (cookies.length) {
    headers.delete("set-cookie");
    for (const cookie of cookies) headers.append("set-cookie", cookie);
  }
  return headers;
}

function errorResponse(status: number, code: string, message: string, requestId: string) {
  return Response.json(
    { data: null, error: { code, message }, requestId },
    { status, headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}

/** Forward one same-origin /api request to the private Fastify service. */
export async function proxyApiRequest(request: Request, pathSegments: string[]) {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const apiOrigin = process.env.API_INTERNAL_URL ?? "http://api:4100";
  let target: URL;

  try {
    const configured = new URL(apiOrigin);
    if (!(["http:", "https:"].includes(configured.protocol)) || configured.username || configured.password || configured.search || configured.hash) {
      throw new Error("Invalid API origin");
    }
    if (pathSegments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\") || segment.includes("\0"))) {
      return errorResponse(400, "invalid_api_path", "The API path is invalid.", requestId);
    }

    target = new URL(`/api/${pathSegments.map(encodeURIComponent).join("/")}`, configured.origin);
    target.search = new URL(request.url).search;
  } catch {
    return errorResponse(500, "proxy_configuration_error", "The internal API proxy is not configured correctly.", requestId);
  }

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const init = {
    method,
    headers: copyRequestHeaders(request.headers),
    ...(hasBody && request.body ? { body: request.body, duplex: "half" as const } : {}),
    cache: "no-store" as const,
    redirect: "manual" as const,
  };

  try {
    const upstream = await fetch(target, init);
    const headers = copyResponseHeaders(upstream.headers);
    headers.set("cache-control", "no-store");
    headers.set("x-proxy-request-id", requestId);

    const location = headers.get("location");
    if (location) {
      try {
        const redirectUrl = new URL(location, target);
        if (redirectUrl.origin === target.origin) {
          const incomingUrl = new URL(request.url);
          const configuredBasePath = appBasePath;
          redirectUrl.pathname = `${configuredBasePath}${redirectUrl.pathname}`;
          headers.set("location", new URL(`${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`, incomingUrl.origin).toString());
        }
      } catch {
        // Keep the upstream Location unchanged when it is not a valid URL.
      }
    }

    const noBody = method === "HEAD" || [204, 205, 304].includes(upstream.status);
    return new Response(noBody ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch {
    return errorResponse(502, "backend_unavailable", "The internal API service could not be reached.", requestId);
  }
}
