#!/usr/bin/env node
// Uploads an image to the klokie-media R2 bucket as a set of pre-generated
// responsive variants (webp + avif at multiple widths) plus the original.
//
// Variants are derived from the key by inserting -<width>w before the
// extension and swapping the extension for the format. Example for key
// "posters/2026-06-06-tida.png":
//   posters/2026-06-06-tida.png            (original, re-encoded compact)
//   posters/2026-06-06-tida-400w.webp
//   posters/2026-06-06-tida-400w.avif
//   posters/2026-06-06-tida-640w.webp
//   posters/2026-06-06-tida-640w.avif
//   ...etc
//
// ResponsiveImage.astro reconstructs the variant URLs from the original
// URL using the same convention, so frontmatter still only stores one
// `image:` URL.
//
// Usage:
//   node scripts/upload-media.mjs <local-file> [<key>]
//
// Requirements: wrangler logged in (with CLOUDFLARE_ACCOUNT_ID set if the
// account is ambiguous), sharp (devDependency), pbcopy (macOS, optional).

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const BUCKET = "klokie-media";
const PUBLIC_HOST = "media.klokie.com";
const WIDTHS = [400, 640, 800, 1200, 1600];
const FORMATS = [
  { ext: "avif", options: { quality: 60, effort: 4 } },
  { ext: "webp", options: { quality: 82 } },
];

// The stored "original" doubles as the og:image used for link previews and as
// the <picture> fallback. Link-preview scrapers reject or time out on heavy
// files (e.g. a raw 3.5 MB poster export previews nowhere), so we never store
// the source verbatim — it's re-encoded through sharp with format-appropriate
// compression and capped to MAX_ORIGINAL_WIDTH. The on-page experience is
// unaffected: the <picture> serves the much smaller avif/webp variants.
const MAX_ORIGINAL_WIDTH = 1600;
const ORIGINAL_BUDGET_KB = 2048; // soft budget; warn (don't fail) if exceeded

// Re-encode the source in its own format with compact settings. Returns the
// sharp result ({ data, info }) or null if the format isn't one we optimize
// (in which case the caller uploads the source verbatim).
async function buildOriginal(srcPath, format, srcWidth) {
  let pipeline = sharp(srcPath);
  if (srcWidth > MAX_ORIGINAL_WIDTH) {
    pipeline = pipeline.resize({
      width: MAX_ORIGINAL_WIDTH,
      withoutEnlargement: true,
    });
  }
  switch (format) {
    case "png":
      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: true,
        quality: 90,
        effort: 10,
      });
      break;
    case "jpeg":
    case "jpg":
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: 82 });
      break;
    default:
      return null;
  }
  return pipeline.toBuffer({ resolveWithObject: true });
}

const args = process.argv.slice(2);
if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
  console.error(
    [
      "Usage: node scripts/upload-media.mjs <local-file> [<key>]",
      "",
      "  <local-file>   path to image on disk",
      "  <key>          optional R2 key (e.g. posters/2026-06-06-tida.png).",
      "                 Defaults to <basename>.",
      "",
      "Generates webp+avif variants at widths " +
        WIDTHS.join("/") +
        " (skipping",
      "widths larger than the original) and uploads them alongside the original.",
    ].join("\n"),
  );
  process.exit(args.length < 1 ? 1 : 0);
}

const [file, keyArg] = args;
if (!existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const key = keyArg ?? basename(file);
const ext = extname(key);
const stem = key.slice(0, -ext.length);
if (!ext) {
  console.error(`Key must have an extension: ${key}`);
  process.exit(1);
}

const srcSizeKb = (statSync(file).size / 1024).toFixed(1);

const meta = await sharp(file).metadata();
if (!meta.width || !meta.height) {
  console.error(`Could not read image dimensions from ${file}`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "upload-media-"));

// Dimensions of the stored original — recomputed after re-encoding (the cap
// can shrink them) and reused in the frontmatter snippet below.
let originalWidth = meta.width;
let originalHeight = meta.height;

try {
  // Build the compact original (see buildOriginal above). Keep the source
  // verbatim only if re-encoding would somehow be larger, or if we don't
  // optimize this format.
  const optimized = await buildOriginal(file, meta.format, meta.width);
  let originalPath = file;
  if (optimized && optimized.data.length < statSync(file).size) {
    originalPath = join(tmp, `original${ext}`);
    writeFileSync(originalPath, optimized.data);
    originalWidth = optimized.info.width;
    originalHeight = optimized.info.height;
  }
  const originalSizeKb = (statSync(originalPath).size / 1024).toFixed(1);

  // Emit a variant at every standard width below the original, plus one at
  // the original width itself — so the largest srcset entry is always an
  // avif/webp instead of forcing the browser to fall back to the (larger)
  // original PNG/JPG. ResponsiveImage.astro must use the same rule.
  const targets = [
    ...new Set([...WIDTHS.filter((w) => w < originalWidth), originalWidth]),
  ];

  console.log(
    `Source: ${file} (${srcSizeKb} KB, ${meta.width}×${meta.height}, ${meta.format})`,
  );
  if (originalPath !== file) {
    console.log(
      `Original re-encoded → ${originalSizeKb} KB, ${originalWidth}×${originalHeight} (was ${srcSizeKb} KB)`,
    );
  }
  if (Number(originalSizeKb) > ORIGINAL_BUDGET_KB) {
    console.warn(
      `⚠️  Original is ${originalSizeKb} KB (> ${ORIGINAL_BUDGET_KB} KB). This is the og:image — ` +
        `some link-preview scrapers may skip it. Consider a simpler/flatter source image.`,
    );
  }
  console.log(
    `Generating ${targets.length} width(s) × ${FORMATS.length} format(s) = ${targets.length * FORMATS.length} variants`,
  );

  const uploads = [{ path: originalPath, key, label: "original" }];

  for (const w of targets) {
    for (const { ext: outExt, options } of FORMATS) {
      const variantKey = `${stem}-${w}w.${outExt}`;
      const variantPath = join(tmp, `${w}w.${outExt}`);
      const pipeline = sharp(file).resize({
        width: w,
        withoutEnlargement: true,
      });
      const buf = await pipeline.toFormat(outExt, options).toBuffer();
      writeFileSync(variantPath, buf);
      uploads.push({
        path: variantPath,
        key: variantKey,
        label: `${w}w ${outExt}`,
      });
    }
  }

  for (const u of uploads) {
    const sz = (statSync(u.path).size / 1024).toFixed(1);
    process.stdout.write(
      `Uploading ${u.label.padEnd(12)} → r2://${BUCKET}/${u.key} (${sz} KB) ... `,
    );
    const result = spawnSync(
      "npx",
      [
        "wrangler",
        "r2",
        "object",
        "put",
        `${BUCKET}/${u.key}`,
        `--file=${u.path}`,
        "--remote",
      ],
      { stdio: ["inherit", "pipe", "inherit"] },
    );
    if (result.status !== 0) {
      console.log("FAILED");
      console.error(
        "\nUpload failed. If you're not logged in: npx wrangler login",
      );
      console.error("If multiple accounts: set CLOUDFLARE_ACCOUNT_ID");
      process.exit(result.status ?? 1);
    }
    console.log("ok");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const url = `https://${PUBLIC_HOST}/${key}`;
try {
  spawnSync("pbcopy", { input: url, encoding: "utf8" });
} catch {}

console.log("");
console.log(`Public URL: ${url}`);
console.log("(copied to clipboard)");
console.log("");
console.log("Frontmatter snippet:");
console.log("---");
console.log(`image: ${url}`);
console.log("imageAlt: ");
console.log(`imageWidth: ${originalWidth}`);
console.log(`imageHeight: ${originalHeight}`);
console.log("---");
