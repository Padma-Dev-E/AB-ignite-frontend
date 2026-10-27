# AB Ignite Frontend

Next.js employee and privileged-workspace UI. Business requests are proxied to the Fastify API; this repo has no SQLite database or migration code.

The frontend Docker image uses Node.js 24 by default. `NODE_IMAGE` can override the base image when building for another supported runtime.

## Local development

1. Copy `.env.example` to `.env` and set the shared auth secret plus internal API token to the same values configured for the backend.
2. Set `API_INTERNAL_URL` to the private Fastify address.
3. Run `npm ci`, then `npm run dev`.

The frontend owns the browser-facing Auth.js session. Credential verification and session state are performed by the backend over the private API network.

## Docker with separate repositories

The frontend Compose file builds only this repository and loads this repository's `.env`. It joins the external private network `ab-ignite-local_api_private` created by the backend Compose file. Start the backend first, then run `docker compose up -d --build` from this repository. The frontend is available on `127.0.0.1:3000` and `127.0.0.1:3100`; its server-side API requests use `http://api:4100` over the private network.

Set `APP_URL` in this repository's `.env` to the public application origin. This is runtime configuration used by Auth.js; it is not needed to build the image. The frontend image is built to serve from `/` and listens on `0.0.0.0:3000`. Compose exposes it at `http://localhost:3000` and retains `http://localhost:3100` for the existing local tunnel.

For Kubernetes or another image registry build, build the image without environment-specific URL arguments, then supply `APP_URL` as a runtime variable in the Deployment or Helm values. Set `API_INTERNAL_URL` to the Kubernetes Service DNS address for Fastify, such as `http://ab-ignite-backend:4100`.

The image serves at the root path. Configure the Ingress to expose the app at `/` on its host. A public subpath such as `/ab-ignite` needs an Ingress design that also handles the app's generated routes, assets, and API paths; setting `APP_URL` alone does not add that prefix.

Only UI-facing helpers remain alongside the screens: password field feedback, permission-based visibility, and live idea-score/AI-progress previews. These improve interaction only; Fastify owns and rechecks the rules before changing data.
