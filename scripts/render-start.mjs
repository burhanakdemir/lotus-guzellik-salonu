/**
 * Render canlı başlangıç: prod-setup + next start (public/ doğrudan sunulur).
 */
import { existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const servicesDir = join(root, "public", "services");

if (existsSync(servicesDir)) {
  const jpgs = readdirSync(servicesDir).filter((f) => f.endsWith(".jpg"));
  const svgs = readdirSync(servicesDir).filter((f) => f.endsWith(".svg"));
  console.log(`→ public/services: ${jpgs.length} JPG, ${svgs.length} SVG`);
}

const child = spawn("npm", ["run", "start:render"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
  },
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
