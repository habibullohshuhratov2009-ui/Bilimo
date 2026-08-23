/** UX yurish: haqiqiy foydalanuvchi kabi bosib o'tamiz va har qadamni suratga olamiz. */
import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-mackbook-main-bot/a9f460b2-6e3b-4d03-b0a5-e063775c1118/scratchpad/ux";
const B = process.env.BASE || "http://localhost:3000";
const fs = await import("node:fs"); fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const problems = [];
page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text().slice(0, 120)); });
page.on("pageerror", (e) => problems.push("pageerror: " + String(e).slice(0, 120)));

let n = 0;
const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2,"0")}-${name}.png`, fullPage: false }); };

async function step(name, fn) {
  try { await fn(); await page.waitForTimeout(900); await shot(name); console.log("✓", name); }
  catch (e) { problems.push(`${name}: ${String(e).slice(0, 160)}`); console.log("✗", name, String(e).slice(0, 90)); }
}

await step("lending-tepa", async () => { await page.goto(B + "/", { waitUntil: "networkidle" }); });
await step("lending-past", async () => { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); });
await step("kirish-ochildi", async () => {
  await page.goto(B + "/kirish", { waitUntil: "networkidle" });
});
// gorizontal skroll bormi (mobil buzilishi)
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
if (overflow) problems.push("MOBIL: gorizontal skroll bor (sahifa ekranga sig'maydi)");

// tugmalarning o'lchamini tekshiramiz (barmoq uchun 44px dan kam bo'lmasin)
const small = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll("button, a[href]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.height < 40) bad.push((el.textContent || "").trim().slice(0, 24) + ` (${Math.round(r.height)}px)`);
  });
  return bad.slice(0, 6);
});
if (small.length) problems.push("KICHIK TUGMALAR (<40px): " + small.join(" · "));

console.log("\n=== MUAMMOLAR ===");
console.log(problems.length ? problems.map((p) => " • " + p).join("\n") : " (topilmadi)");
await browser.close();
