"use client";

import { useState } from "react";
import { withBasePath } from "../../lib/routing/base-path";

type HeaderRow = { id: string; name: string; value: string };
type OutboundHeader = { name: string; value: string };
type TestResult = {
  requestId?: string;
  request?: { method: string; url: string; headers: OutboundHeader[]; hasBody: boolean; body: unknown };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string | string[]>;
    bodyText: string;
    truncated: boolean;
  };
  error?: { name?: string; message?: string; code?: string };
  httpStatus?: number;
  rawBody?: string;
};

const methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "CONNECT"];

export function AiTestPage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<HeaderRow[]>([]);
  const [body, setBody] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const hasBody = body.trim().length > 0;
    let jsonBody: unknown = null;
    if (hasBody) {
      try {
        jsonBody = JSON.parse(body);
      } catch (error) {
        setResult({ error: { name: "SyntaxError", message: error instanceof Error ? error.message : String(error) } });
        return;
      }
    }
    setBusy(true);
    try {
      const response = await fetch(withBasePath("/api/ai-test"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          method,
          headers: headers.filter((header) => header.name.trim()),
          hasBody,
          body: jsonBody,
        }),
        cache: "no-store",
      });
      const rawBody = await response.text();
      let payload: TestResult;
      try {
        payload = JSON.parse(rawBody) as TestResult;
      } catch {
        payload = { httpStatus: response.status, rawBody };
      }
      if (payload.response || payload.error) {
        setResult({ ...payload, httpStatus: response.status, rawBody });
      } else {
        setResult({
          error: { name: "InvalidResponseError", message: "Fastify returned a response without a result or error." },
          httpStatus: response.status,
          rawBody,
        });
      }
    } catch (error) {
      setResult({
        error: {
          name: error instanceof Error ? error.name : "Error",
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      setBusy(false);
    }
  }

  function updateHeader(id: string, field: "name" | "value", value: string) {
    setHeaders((current) => current.map((header) => header.id === id ? { ...header, [field]: value } : header));
  }

  const targetResponse = result?.response;

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-[#172b45] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1762a7]">AB Ignite · diagnostics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">API request test</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64758b]">
            Configure an HTTP request here. Next.js sends the configuration to Fastify, and Fastify makes the request and returns the upstream response.
          </p>
          <a href={withBasePath("/status")} className="mt-3 inline-flex text-sm font-medium text-[#1762a7] underline underline-offset-4">Check Next.js ↔ Fastify connection</a>
        </header>

        <form onSubmit={sendRequest} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="rounded-2xl border border-[#dce4ed] bg-white p-5 shadow-[0_10px_30px_rgba(27,55,88,0.06)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f1fb] text-sm font-semibold text-[#1762a7]">1</span>
              <div><h2 className="font-semibold">Request</h2><p className="text-xs text-[#718197]">The target call runs from Fastify.</p></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div>
                <label htmlFor="request-method" className="mb-1.5 block text-sm font-medium">Method</label>
                <input
                  id="request-method"
                  list="http-method-options"
                  required
                  value={method}
                  onChange={(event) => setMethod(event.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-[#cbd6e2] bg-white px-3 py-3 font-mono text-sm outline-none transition focus:border-[#1762a7] focus:ring-2 focus:ring-[#1762a7]/15"
                />
                <datalist id="http-method-options">{methods.map((value) => <option key={value} value={value} />)}</datalist>
              </div>
              <div>
                <label htmlFor="request-url" className="mb-1.5 block text-sm font-medium">Request URL</label>
                <input
                  id="request-url"
                  type="text"
                  required
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://api.example.com/v1/endpoint"
                  className="w-full rounded-xl border border-[#cbd6e2] bg-white px-3.5 py-3 font-mono text-sm outline-none transition focus:border-[#1762a7] focus:ring-2 focus:ring-[#1762a7]/15"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Headers</h3>
                <button type="button" onClick={() => setHeaders((current) => [...current, { id: crypto.randomUUID(), name: "", value: "" }])} className="rounded-lg border border-[#cbd6e2] px-3 py-1.5 text-xs font-semibold text-[#1762a7] hover:bg-[#f5f8fc]">Add header</button>
              </div>
              {headers.length === 0 ? (
                <p className="rounded-xl bg-[#f5f8fc] px-3.5 py-3 text-xs text-[#718197]">No destination headers are configured.</p>
              ) : (
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={header.id} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] gap-2">
                      <input aria-label={`Header ${index + 1} name`} value={header.name} onChange={(event) => updateHeader(header.id, "name", event.target.value)} placeholder="Header name" className="min-w-0 rounded-lg border border-[#cbd6e2] px-3 py-2 font-mono text-xs outline-none focus:border-[#1762a7]" />
                      <input aria-label={`Header ${index + 1} value`} value={header.value} onChange={(event) => updateHeader(header.id, "value", event.target.value)} placeholder="Header value" className="min-w-0 rounded-lg border border-[#cbd6e2] px-3 py-2 font-mono text-xs outline-none focus:border-[#1762a7]" />
                      <button type="button" aria-label={`Remove header ${index + 1}`} onClick={() => setHeaders((current) => current.filter((item) => item.id !== header.id))} className="rounded-lg px-2 text-lg text-[#9a3030] hover:bg-[#fff4f3]">×</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs leading-5 text-[#718197]">No application headers are added automatically. The HTTP runtime supplies transport headers such as Host and Content-Length.</p>
            </div>

            <label htmlFor="request-body" className="mb-1.5 mt-5 block text-sm font-medium">JSON request body</label>
            <textarea
              id="request-body"
              spellCheck={false}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={'Optional JSON, for example:\n{\n  "key": "value"\n}'}
              className="min-h-[240px] w-full resize-y rounded-xl border border-[#cbd6e2] bg-[#fbfcfe] px-3.5 py-3 font-mono text-[13px] leading-6 outline-none transition focus:border-[#1762a7] focus:ring-2 focus:ring-[#1762a7]/15"
            />

            <button type="submit" disabled={busy || !url.trim() || !method.trim()} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1762a7] px-5 text-sm font-semibold text-white transition hover:bg-[#104f8a] disabled:cursor-not-allowed disabled:opacity-55">
              {busy ? "Sending from Fastify…" : "Send request"}
            </button>
            <p className="mt-3 text-xs leading-5 text-[#718197]">Enter valid JSON. Fastify sends it as JSON and adds Content-Type: application/json when you have not supplied that header. Sending requires a back-office session.</p>
          </section>

          <section className="min-h-[520px] rounded-2xl border border-[#dce4ed] bg-white p-5 shadow-[0_10px_30px_rgba(27,55,88,0.06)] sm:p-6" aria-live="polite">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f1fb] text-sm font-semibold text-[#1762a7]">2</span>
              <div><h2 className="font-semibold">Response</h2><p className="text-xs text-[#718197]">Upstream status, headers, raw body, or Fastify error.</p></div>
            </div>

            {!result && <div className="grid min-h-[390px] place-items-center rounded-xl border border-dashed border-[#d5dfeb] bg-[#fbfcfe] p-6 text-center text-sm text-[#718197]">The upstream response will appear here after you send a request.</div>}

            {result && (
              <div className="space-y-4">
                {targetResponse ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold ${targetResponse.status >= 200 && targetResponse.status < 400 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{targetResponse.status} {targetResponse.statusText}</span>
                      {targetResponse.truncated && <span className="rounded-lg bg-[#fff2d8] px-2.5 py-1 text-xs font-medium text-[#80520b]">Response body truncated at 128 KB</span>}
                    </div>
                    <details className="rounded-xl border border-[#e0e7ef]">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Outgoing request</summary>
                      <pre className="max-h-64 overflow-auto border-t border-[#e0e7ef] bg-[#f8faff] p-4 text-xs leading-5">{JSON.stringify(result.request, null, 2)}</pre>
                    </details>
                    <details className="rounded-xl border border-[#e0e7ef]">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Response headers</summary>
                      <pre className="max-h-64 overflow-auto border-t border-[#e0e7ef] bg-[#f8faff] p-4 text-xs leading-5">{JSON.stringify(targetResponse.headers, null, 2)}</pre>
                    </details>
                    {result.requestId && <p className="break-all text-xs text-[#718197]">Fastify request ID: {result.requestId}</p>}
                    <pre className="min-h-[300px] max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#101c2d] p-4 text-xs leading-5 text-[#e4edf8]">{targetResponse.bodyText || "(empty response body)"}</pre>
                  </>
                ) : (
                  <>
                    {result.httpStatus !== undefined && <p className="font-mono text-xs font-semibold text-[#9a3030]">Fastify HTTP {result.httpStatus}</p>}
                    {result.error?.name && <p className="font-mono text-xs text-[#718197]">{result.error.name}{result.error.code ? ` · ${result.error.code}` : ""}</p>}
                    {result.requestId && <p className="break-all text-xs text-[#718197]">Fastify request ID: {result.requestId}</p>}
                    {result.error?.message && <pre className="whitespace-pre-wrap break-words rounded-xl border border-[#e5a5a5] bg-[#fff4f3] p-4 text-sm text-[#9a3030]">{result.error.message}</pre>}
                    {result.rawBody && <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#101c2d] p-4 text-xs leading-5 text-[#e4edf8]">{result.rawBody}</pre>}
                  </>
                )}
              </div>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}
