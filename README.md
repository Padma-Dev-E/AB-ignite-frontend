# AB Ignite Frontend

Next.js employee and privileged-workspace UI. Business requests are proxied to the Fastify API; this repo has no SQLite database or migration code.

The frontend Docker image uses Node.js 24 by default. `NODE_IMAGE` can override the base image when building for another supported runtime.

## Local development

1. Copy `.env.example` to `.env` and set the shared auth secret plus internal API token to the same values configured for the backend.
2. Set `API_INTERNAL_URL` to the private Fastify address.
3. Run `npm ci`, then `npm run dev`.

The frontend owns the browser-facing Auth.js session. Credential verification and session state are performed by the backend over the private API network. `npm run dev` and `npm start` listen on port `3000`; the production start script applies the runtime path from `APP_URL` before starting Next.js.

## Docker with separate repositories

The frontend Compose file builds only this repository and loads this repository's `.env`. It joins the external private network `ab-ignite-local_api_private` created by the backend Compose file. Start the backend first, then run `docker compose up -d --build` from this repository. The frontend is available on `127.0.0.1:3000` and `127.0.0.1:3100`; its server-side API requests use `http://api:4100` over the private network.

Set `APP_URL` in this repository's `.env` to the public frontend URL, including its path if one is used. This is runtime configuration; it is not passed to the image build. The image listens on `0.0.0.0:3000`. Compose exposes it at `http://localhost:3000` and retains `http://localhost:3100` for the existing local tunnel.

For Kubernetes or another image registry build, build the image without environment-specific URL arguments, then supply `APP_URL` as a runtime variable in the Deployment or Helm values. On container start, the frontend validates the URL, applies its path to Next.js routing and generated assets, and uses its origin for Auth.js. Set `API_INTERNAL_URL` to the Kubernetes Service DNS address for Fastify, such as `http://ab-ignite-backend:4100`.

Configure the Ingress to preserve the path from `APP_URL` when forwarding requests to the frontend container on port `3000`. The same image can then be promoted across environments with different hostnames or path prefixes.

Only UI-facing helpers remain alongside the screens: password field feedback, permission-based visibility, and live idea-score/AI-progress previews. These improve interaction only; Fastify owns and rechecks the rules before changing data.
