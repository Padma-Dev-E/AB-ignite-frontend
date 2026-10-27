import { handlers } from "../../../../auth";
import type { NextRequest } from "next/server";
import { proxyApiRequest } from "../../../../src/lib/api/server-proxy";
import { appBasePath, stripBasePath } from "../../../../src/lib/routing/base-path";

function isBackendRefresh(request: Request) {
  return stripBasePath(new URL(request.url).pathname, appBasePath) === "/api/auth/refresh";
}

export const GET = async (request: NextRequest) => isBackendRefresh(request)
  ? proxyApiRequest(request, ["auth", "refresh"])
  : handlers.GET(request);

export const POST = async (request: NextRequest) => isBackendRefresh(request)
  ? proxyApiRequest(request, ["auth", "refresh"])
  : handlers.POST(request);
