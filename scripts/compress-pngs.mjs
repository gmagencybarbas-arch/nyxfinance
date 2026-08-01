import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, a);
    else if (/\.png$/i.test(e.name)) a.push(p);
  }
  return a;
}

async function compressFile(file) {
  const before = fs.statSync(file).size;
  if (before < 80 * 1024) return { file, before, after: before, skipped: true };
  const meta = await sharp(file).metadata();
  let pipeline = sharp(file, { failOn: "none" });
  const maxDim = 1024;
  if ((meta.width || 0) > maxDim || (meta.height || 0) > maxDim) {
    pipeline = pipeline.resize({
      width: maxDim,
      height: maxDim,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const buf = await pipeline
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 82,
      colors: 256,
      effort: 10,
      adaptiveFiltering: true,
    })
    .toBuffer();
  if (buf.length >= before * 0.98) {
    return { file, before, after: before, skipped: true };
  }
  fs.writeFileSync(file, buf);
  return { file, before, after: buf.length, skipped: false };
}

const roots = ["public", "nyx_img"]
  .map((r) => path.join(root, r))
  .filter(fs.existsSync);
const files = roots.flatMap((r) => walk(r));
let saved = 0;
let totalBefore = 0;
let totalAfter = 0;

for (const f of files) {
  try {
    const r = await compressFile(f);
    totalBefore += r.before;
    totalAfter += r.after;
    if (!r.skipped) {
      saved += r.before - r.after;
      const rel = path.relative(root, f);
      console.log(
        `${Math.round(r.before / 1024)}→${Math.round(r.after / 1024)} KB  ${rel}`
      );
    }
  } catch (e) {
    console.error("FAIL", f, e.message);
  }
}

console.log(
  `DONE files=${files.length} saved=${Math.round(saved / 1024)}KB total ${Math.round(totalBefore / 1024)}→${Math.round(totalAfter / 1024)}KB`
);
