/**
 * `npm run dev` — siteyi ve düzenleme aracını birlikte başlatır,
 * Ctrl-C ile ikisini birden kapatır.
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");

const cocuklar = [
  // --watch: aracın kendisi değişirse kendini yeniden başlatır
  spawn(process.execPath, ["--watch", join(KOK, "tools", "editor.mjs")], {
    cwd: KOK,
    stdio: "inherit",
  }),
  spawn("npx", ["next", "dev"], {
    cwd: KOK,
    stdio: "inherit",
    shell: process.platform === "win32",
  }),
];

let kapaniyor = false;

function kapat(kod = 0) {
  if (kapaniyor) return;
  kapaniyor = true;
  for (const cocuk of cocuklar) {
    if (!cocuk.killed) cocuk.kill("SIGTERM");
  }
  process.exit(kod);
}

for (const cocuk of cocuklar) {
  cocuk.on("exit", (kod) => kapat(kod ?? 0));
  cocuk.on("error", (sorun) => {
    console.error(sorun);
    kapat(1);
  });
}

process.on("SIGINT", () => kapat(0));
process.on("SIGTERM", () => kapat(0));
