// Ikki tuzatishni JONLI tekshirish:
//  1) yangi o'quvchi o'qituvchi panelida O'ZI paydo bo'ladimi (sahifa yangilanmasdan)
//  2) sahifa yangilanganda tizimdan chiqib ketmaydimi
import { chromium } from "playwright";

const B = process.env.BASE ?? "https://web2-production-ae24.up.railway.app";
const NICK = `Sinov${Math.floor(Date.now() / 1000) % 100000}`;
const b = await chromium.launch();
let bad = 0;

// ── 1. O'qituvchi panelini ochib turamiz
const tCtx = await b.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "allow" });
const tp = await tCtx.newPage();
await tp.request.post(B + "/api/auth/login", { data: { nickname: "UstozAziza", pin: "1234" } });
await tCtx.addCookies((await tp.request.storageState()).cookies);
await tp.goto(B + "/ustoz", { waitUntil: "networkidle" });
await tp.locator('button:has-text("O\'quvchilar")').first().click();
await tp.waitForTimeout(1000);
const before = await tp.locator("table tbody tr").count();
console.log(`Ustoz panelida hozir: ${before} o'quvchi`);

// ── 2. Yangi o'quvchi ro'yxatdan o'tadi
const sCtx = await b.newContext({ viewport: { width: 390, height: 844 } });
const sp = await sCtx.newPage();
const reg = await sp.request.post(B + "/api/auth/register", {
  data: { nickname: NICK, pin: "7788", role: "student", classCode: "DEMO23" },
});
console.log(`Yangi o'quvchi ${NICK} ro'yxatdan o'tdi: ${reg.status()}`);

// ── 3. O'QITUVCHI SAHIFANI YANGILAMAYDI — o'zi ko'rinishini kutamiz (max 20s)
let appeared = false;
for (let i = 0; i < 10; i++) {
  await tp.waitForTimeout(2000);
  if (await tp.locator(`table tbody tr:has-text("${NICK}")`).count()) {
    appeared = true;
    console.log(`✅ ${(i + 1) * 2}s ichida O'ZI paydo bo'ldi (sahifa yangilanmadi)`);
    break;
  }
}
if (!appeared) {
  bad++;
  console.log("❌ yangi o'quvchi 20s ichida ko'rinmadi");
}

// ── 4. Yangilashda chiqib ketmaydimi
await sCtx.addCookies((await sp.request.storageState()).cookies);
await sp.goto(B + "/panel", { waitUntil: "networkidle" });
for (let i = 1; i <= 3; i++) {
  await sp.reload({ waitUntil: "networkidle" });
  await sp.waitForTimeout(1200);
  const path = new URL(sp.url()).pathname;
  const ok = path === "/panel";
  if (!ok) bad++;
  console.log(`  ${ok ? "✅" : "❌"} o'quvchi yangilash ${i}: ${path}`);
}
for (let i = 1; i <= 3; i++) {
  await tp.reload({ waitUntil: "networkidle" });
  await tp.waitForTimeout(1200);
  const path = new URL(tp.url()).pathname;
  const ok = path === "/ustoz";
  if (!ok) bad++;
  console.log(`  ${ok ? "✅" : "❌"} ustoz yangilash ${i}: ${path}`);
}

await b.close();
console.log(`\nXATO: ${bad}\nTOZALASH KERAK: ${NICK}`);
process.exit(bad ? 1 : 0);
