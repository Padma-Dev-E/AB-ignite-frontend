"use client";

import { useState } from "react";
import { withBasePath } from "../../lib/routing/base-path";

type TestResult = {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: unknown;
  };
  response: {
    status: number;
    statusText: string;
    contentType: string | null;
    requestId: string | null;
    bodyText: string;
    truncated: boolean;
  };
};

const initialBody = JSON.stringify({
  contents: {
    role: "user",
    parts: { text: "hi" },
  },
}, null, 2);

export function AiTestPage() {
  const [url, setUrl] = useState("");
  const [bodyText, setBodyText] = useState(initialBody);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      setError("The request body is not valid JSON.");
      return;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      setError("The request body must be a JSON object.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(withBasePath("/api/ai-test"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, body }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as {
        data?: TestResult | null;
        error?: { message?: string } | null;
      } | null;

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error?.message || `Request failed with HTTP ${response.status}.`);
      }
      setResult(payload.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  }

  const formattedResponse = (() => {
    if (!result) return "";
    try { return JSON.stringify(JSON.parse(result.response.bodyText), null, 2); }
    catch { return result.response.bodyText; }
  })();

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-[#172b45] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1762a7]">AB Ignite · temporary diagnostics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">AI API test</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64758b]">
            Send a JSON request from the backend network and inspect the upstream HTTP response. This page does not use or change the application Gemini SDK flow.
          </p>
          <a href={withBasePath("/status")} className="mt-3 inline-flex text-sm font-medium text-[#1762a7] underline underline-offset-4">Check Next.js ↔ Fastify connection</a>
        </header>

        <form onSubmit={sendRequest} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-[#dce4ed] bg-white p-5 shadow-[0_10px_30px_rgba(27,55,88,0.06)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f1fb] text-sm font-semibold text-[#1762a7]">1</span>
              <div>
                <h2 className="font-semibold">Request</h2>
                <p className="text-xs text-[#718197]">The URL must match backend APIGEE_URL exactly.</p>
              </div>
            </div>

            <label htmlFor="apigee-url" className="mb-1.5 block text-sm font-medium">Request URL</label>
            <input
              id="apigee-url"
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://your-apigee-host/path"
              className="w-full rounded-xl border border-[#cbd6e2] bg-white px-3.5 py-3 font-mono text-sm outline-none transition focus:border-[#1762a7] focus:ring-2 focus:ring-[#1762a7]/15"
            />

            <div className="mt-4 rounded-xl bg-[#f5f8fc] px-3.5 py-3 text-sm">
              <p className="font-medium">Headers sent by the backend</p>
              <code className="mt-1 block text-xs text-[#53667d]">content-type: application/json</code>
              <code className="block text-xs text-[#53667d]">client_id: [configured in backend env; hidden]</code>
            </div>

            <label htmlFor="request-body" className="mb-1.5 mt-5 block text-sm font-medium">JSON body</label>
            <textarea
              id="request-body"
              required
              spellCheck={false}
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
              className="min-h-[300px] w-full resize-y rounded-xl border border-[#cbd6e2] bg-[#fbfcfe] px-3.5 py-3 font-mono text-[13px] leading-6 outline-none transition focus:border-[#1762a7] focus:ring-2 focus:ring-[#1762a7]/15"
            />

            <button
              type="submit"
              disabled={busy || !url.trim()}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1762a7] px-5 text-sm font-semibold text-white transition hover:bg-[#104f8a] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy ? "Sending request…" : "Send request"}
            </button>
            <p className="mt-3 text-xs leading-5 text-[#718197]">Public diagnostic endpoint: requests are limited, capped, and restricted to the configured HTTPS APIGEE_URL.</p>
          </section>

          <section className="min-h-[520px] rounded-2xl border border-[#dce4ed] bg-white p-5 shadow-[0_10px_30px_rgba(27,55,88,0.06)] sm:p-6" aria-live="polite">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f1fb] text-sm font-semibold text-[#1762a7]">2</span>
              <div>
                <h2 className="font-semibold">Response</h2>
                <p className="text-xs text-[#718197]">Upstream status, headers, and raw response body.</p>
              </div>
            </div>

            {error && <div role="alert" className="mb-4 rounded-xl border border-[#e5a5a5] bg-[#fff4f3] px-4 py-3 text-sm text-[#9a3030]">{error}</div>}

            {!result && !error && (
              <div className="grid min-h-[390px] place-items-center rounded-xl border border-dashed border-[#d5dfeb] bg-[#fbfcfe] p-6 text-center text-sm text-[#718197]">
                The upstream response will appear here after you send a request.
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#edf3f9] px-2.5 py-1 font-mono text-xs font-semibold">{result.response.status} {result.response.statusText}</span>
                  <span className="text-xs text-[#718197]">{result.response.contentType || "content-type not returned"}</span>
                  {result.response.truncated && <span className="rounded-lg bg-[#fff2d8] px-2.5 py-1 text-xs font-medium text-[#80520b]">Body truncated at 128 KB</span>}
                </div>

                <details className="rounded-xl border border-[#e0e7ef]">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Actual outgoing request</summary>
                  <pre className="max-h-64 overflow-auto border-t border-[#e0e7ef] bg-[#f8faff] p-4 text-xs leading-5">{JSON.stringify(result.request, null, 2)}</pre>
                </details>

                {result.response.requestId && <p className="break-all text-xs text-[#718197]">Upstream request ID: {result.response.requestId}</p>}
                <pre className="min-h-[300px] max-h-[60vh] overflow-auto rounded-xl bg-[#101c2d] p-4 text-xs leading-5 text-[#e4edf8]">{formattedResponse || "(empty response body)"}</pre>
              </div>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}
