import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: [
      "*.node",
      "bufferutil",
      "utf-8-validate",
      "pino-pretty",
      "thread-stream",
      "pino/file",
    ],
    sourcemap: "linked",
    banner: {
      js: `import { createRequire as __cr } from 'node:module';
import __path from 'node:path';
import __url from 'node:url';
globalThis.require = __cr(import.meta.url);
globalThis.__filename = __url.fileURLToPath(import.meta.url);
globalThis.__dirname = __path.dirname(globalThis.__filename);
`,
    },
  });
  console.log("\u2705 Build completed!");
}

buildAll().catch((err) => { console.error(err); process.exit(1); });
