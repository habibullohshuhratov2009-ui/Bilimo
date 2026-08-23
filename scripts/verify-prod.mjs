// Jonli saytni tekshirish (faqat O'QIYDI — yangi akkaunt yaratmaydi).
import { chromium } from "playwright";

const B = process.env.BASE ?? "https://web2-production-ae24.up.railway.app";
const OUT = new URL("../.shots/", import.meta.url).pathname;
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();

console.log("──── LENDING ────");
await p.goto(B, { waitUntil: "networkidle" });
console.log("  APK tugma:", await p.locator('a[href="/Bilimo.apk"]').count());
console.log("  Windows tugma:", await p.locator('a[href*="releases/latest"]').count());
for (const [n, sel] of [["Yordam", 'header a[href="/yordam"]'], ["Kirish", 'header a[href="/kirish"]']]) {
  const bb = await p.locator(sel).first().boundingBox();
  console.log(`  ${n}: ${Math.round(bb.width)}x${Math.round(bb.height)} → ${bb.height >= 44 ? "OK" : "KICHIK"}`);
}
await p.locator("#yuklab-olish").scrollIntoViewIfNeeded();
await p.screenshot({ path: OUT + "01-yuklab-olish.png" });

console.log("──── O'QUVCHI ────");
const r = await p.request.post(B + "/api/auth/login", { data: { nickname: "Diyor", pin: "1234" } });
console.log("  login Diyor:", r.status());
if (r.ok()) {
  await ctx.addCookies((await p.request.storageState()).cookies);
  await p.goto(B + "/panel", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  console.log("  onboarding:", (await p.locator("text=Savolingni yoz").count()) > 0 ? "KO'RINDI" : "YO'Q");
  await p.screenshot({ path: OUT + "02-onboarding.png" });
}

console.log("──── USTOZ ────");
const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p2 = await ctx2.newPage();
const r2 = await p2.request.post(B + "/api/auth/login", { data: { nickname: "UstozAziza", pin: "1234" } });
console.log("  login UstozAziza:", r2.status());
if (r2.ok()) {
  await ctx2.addCookies((await p2.request.storageState()).cookies);
  await p2.goto(B + "/ustoz", { waitUntil: "networkidle" });
  await p2.waitForTimeout(1500);
  console.log("  AI tugma:", (await p2.locator("text=Sinf holatini tahlil qil").count()) > 0 ? "BOR" : "YO'Q");
  const txt = await p2.locator("main").innerText();
  console.log("  foiz metrikasi:", /to'g'ri javob, %/.test(txt) ? "BOR" : "YO'Q");
  const bad = ["Sinov", "testuz", "Live2", "Regres", "Tekshir", "AuditBot"].filter((x) => txt.includes(x));
  console.log("  sinov akkauntlar:", bad.length ? bad.join(", ") : "YO'Q — toza");
  await p2.screenshot({ path: OUT + "03-ustoz.png", fullPage: true });
}
await b.close();
