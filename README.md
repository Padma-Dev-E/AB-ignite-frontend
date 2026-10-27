# AB Ignite Frontend

Next.js employee and privileged-workspace UI. Business requests are proxied to the Fastify API; this repo has no SQLite database or migration code.

The frontend Docker image uses Node.js 24 by default. `NODE_IMAGE` can override the base image when building for another supported runtime.

## Local development

1. Copy `.env.example` to `.env` and set the shared auth secret plus internal API token to the same values configured for the backend.
2. Set `API_INTERNAL_URL` to the private Fastify address.
3. Run `npm ci`, then `npm run dev`.

The frontend owns the browser-facing Auth.js session. Credential verification and session state are performed by the backend over the private API network.

## Docker with separate repositories

The frontend Compose file builds only this repository and loads this repository's `.env`. It joins the external private network `ab-ignite-local_api_private` created by the backend Compose file. Start the backend first, then run `docker compose up -d --build` from this repository. The frontend is available on `127.0.0.1:3100`; its server-side API requests use `http://api:4100` over the private network.

Set `APP_URL` in this repository's `.env` to the complete public frontend URL, including any path prefix. Examples: `http://localhost:3100` for local root hosting, `https://company.com` for production root hosting, or `https://company.com/ab-ignite` for production under a path. The frontend derives the Next.js base path and Auth.js public origin from this single value. Because Next.js embeds its base path in the build, rebuild the frontend image after changing `APP_URL`.

Only UI-facing helpers remain alongside the screens: password field feedback, permission-based visibility, and live idea-score/AI-progress previews. These improve interaction only; Fastify owns and rechecks the rules before changing data.
