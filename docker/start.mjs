import { spawn } from "node:child_process";
import { resolve } from "node:path";
import "./prepare-runtime.mjs";

const nextBin = resolve("node_modules/.bin/next");
const child = spawn(process.execPath, [nextBin, "start", "--hostname", "0.0.0.0", "--port", "3000"], {
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error("Failed to start Next.js:", error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
