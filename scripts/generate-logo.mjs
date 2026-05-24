import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "logo-lotus.png");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#000000"/>
  <g transform="translate(256 256)">
    ${[0, 45, 90, 135, 22.5, 67.5, 112.5, 157.5]
      .map(
        (deg, i) =>
          `<ellipse cx="0" cy="-40" rx="28" ry="64" fill="${i % 2 ? "#D97B9A" : "#F4A4BC"}" transform="rotate(${deg})"/>`
      )
      .join("")}
    <circle cx="0" cy="0" r="36" fill="#F5D76E"/>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log("✓ public/logo-lotus.png");
