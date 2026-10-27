try {
  const basePath = new URL(process.env.APP_URL ?? "http://localhost:3000").pathname.replace(/\/+$/, "");
  const response = await fetch(`http://127.0.0.1:3000${basePath}/login`, { signal: AbortSignal.timeout(5000) });
  if (response.status !== 200) process.exitCode = 1;
} catch {
  process.exitCode = 1;
}
