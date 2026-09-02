/**
 * `npm run yayinla` — panelde yaptığın değişiklikleri siteye gönderir.
 * Depoya kaydeder, GitHub'a yollar; Cloudflare gerisini kendisi yapar.
 */

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");

const git = (...arg) =>
  execFileSync("git", arg, { cwd: KOK, encoding: "utf8" }).trim();

try {
  if (!git("status", "--porcelain")) {
    console.log("\n  Değişiklik yok, gönderilecek bir şey bulunamadı.\n");
    process.exit(0);
  }

  const mesaj =
    process.argv.slice(2).join(" ") ||
    `İçerik güncellendi — ${new Date().toLocaleDateString("tr-TR")}`;

  console.log("\n  Değişiklikler kaydediliyor…");
  git("add", "-A");
  git("commit", "-m", mesaj);

  console.log("  GitHub'a gönderiliyor…");
  git("push", "origin", "main");

  console.log("\n  ✓ Gönderildi. Site birkaç dakika içinde güncellenir.");
  console.log("    https://yigitbuyukbas.com\n");
} catch (sorun) {
  const cikti = sorun.stdout || sorun.stderr || sorun.message;
  console.error("\n  ✗ Gönderilemedi:\n");
  console.error(String(cikti).trim(), "\n");
  process.exit(1);
}
