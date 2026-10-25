# AB Ignite Frontend

Next.js employee and privileged-workspace UI. Business requests are proxied to the Fastify API; this repo has no SQLite database or migration code.

## Local development

1. Copy `.env.example` to `.env` and set the shared auth secret plus internal API token to the same values configured for the backend.
2. Set `API_INTERNAL_URL` to the private Fastify address.
3. Run `npm ci`, then `npm run dev`.

The frontend owns the browser-facing Auth.js session. Credential verification and session state are performed by the backend over the private API network.
