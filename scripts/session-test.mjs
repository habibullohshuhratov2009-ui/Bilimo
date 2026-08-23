// Sessiya sahifa yangilanganda saqlanib qolyaptimi? Haqiqiy brauzerda tekshiramiz.
import { chromium } from "playwright";

const B = process.env.BASE ?? "https://web2-production-ae24.up.railway.app";
const CASES = [
  { who: "o'quvchi", nick: "Diyor", pin: "1234", path: "/panel" },
  { who: "ustoz", nick: "UstozAziza", pin: "1234", path: "/ustoz" },
];

const b = await chromium.launch();
let bad = 0;

for (const c of CASES) {
  // serviceWorkers: "allow" — haqiqiy foydalanuvchidagidek (PWA yoqilgan)
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "allow" });
  const p = await ctx.newPage();

  // UI orqali kirish
  await p.goto(B + "/kirish", { waitUntil: "networkidle" });
  const r = await p.request.post(B + "/api/auth/login", { data: { nickname: c.nick, pin: c.pin } });
  await ctx.addCookies((await p.request.storageState()).cookies);
  await p.goto(B + c.path, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  console.log(`\n── ${c.who} — login ${r.status()}, ochildi: ${new URL(p.url()).pathname}`);

  for (let i = 1; i <= 5; i++) {
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    const path = new URL(p.url()).pathname;
    const ok = path === c.path;
    if (!ok) bad++;
    const ck = (await ctx.cookies()).find((x) => x.name === "sinf_session");
    console.log(
      `  ${ok ? "✅" : "❌"} yangilash ${i}: ${path}  (cookie: ${ck ? "bor" : "YO'Q"})`
    );
    if (!ok) break;
  }
  await ctx.close();
}

await b.close();
console.log(`\nXATO: ${bad}`);
process.exit(bad ? 1 : 0);
