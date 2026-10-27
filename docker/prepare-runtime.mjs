import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BUILD_BASE_PATH_TOKEN, getRuntimeAppUrl } from "./runtime-url.mjs";

const buildDir = join(process.cwd(), ".next");
const marker = Buffer.from(BUILD_BASE_PATH_TOKEN);
const replacement = Buffer.from(getRuntimeAppUrl().basePath);
const stateFile = join(buildDir, ".runtime-base-path.json");

async function replaceInFiles(directory) {
  let changedFiles = 0;
  let replacedCount = 0;

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const result = await replaceInFiles(path);
      changedFiles += result.changedFiles;
      replacedCount += result.replacedCount;
      continue;
    }
    if (!entry.isFile() || entry.name === ".runtime-base-path.json") continue;

    const input = await readFile(path);
    let cursor = 0;
    let count = 0;
    const pieces = [];
    while (true) {
      const found = input.indexOf(marker, cursor);
      if (found < 0) break;
      // Next's middleware manifest JSON-escapes the slash before a base path.
      // With a root deployment, remove those escapes with the path marker or
      // the matcher JSON contains an invalid `\(` escape.
      let replaceStart = found;
      if (replacement.length === 0) {
        while (replaceStart > cursor && input[replaceStart - 1] === 0x5c) replaceStart -= 1;
      }
      pieces.push(input.subarray(cursor, replaceStart), replacement);
      cursor = found + marker.length;
      count += 1;
    }
    if (!count) continue;

    pieces.push(input.subarray(cursor));
    const output = Buffer.concat(pieces);
    const temporaryPath = `${path}.runtime-tmp`;
    await writeFile(temporaryPath, output, { mode: (await stat(path)).mode });
    await rename(temporaryPath, path);
    changedFiles += 1;
    replacedCount += count;
  }

  return { changedFiles, replacedCount };
}

let priorState;
try {
  priorState = JSON.parse(await readFile(stateFile, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const basePath = getRuntimeAppUrl().basePath;
if (priorState) {
  if (priorState.basePath !== basePath) {
    throw new Error("APP_URL path changed after this container initialized; replace the container to apply the new path.");
  }
  if (priorState.status === "complete") {
    console.log(`Runtime base path already initialized: ${basePath || "/"}`);
  } else {
    const result = await replaceInFiles(buildDir);
    await writeFile(stateFile, JSON.stringify({ basePath, status: "complete", changedFiles: result.changedFiles, replacedCount: result.replacedCount }));
    console.log(`Completed runtime base path ${basePath || "/"} initialization.`);
  }
} else {
  await writeFile(stateFile, JSON.stringify({ basePath, status: "patching" }));
  const result = await replaceInFiles(buildDir);
  if (!result.replacedCount) {
    throw new Error("The runtime base-path placeholder was not found in the Next.js build output.");
  }
  await writeFile(stateFile, JSON.stringify({ basePath, status: "complete", changedFiles: result.changedFiles, replacedCount: result.replacedCount }));
  console.log(`Initialized runtime base path ${basePath || "/"} in ${result.changedFiles} build files.`);
}
