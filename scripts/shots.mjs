import { chromium } from "playwright";
const OUT = "/private/tmp/claude-501/-Users-mackbook-main-bot/a9f460b2-6e3b-4d03-b0a5-e063775c1118/scratchpad/shots";
const B = "http://localhost:3000";
const fs = await import("node:fs"); fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();

async function shot(name, url, full = true) {
  await p.goto(B + url, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log("shot:", name, await p.title());
}

// 1. ochiq sahifalar
await shot("1-lending", "/");
await shot("2-yordam", "/yordam");
await shot("3-kirish", "/kirish");

// 2. o'quvchi sifatida ro'yxatdan o'tamiz (DEMO23 sinfiga)
const nick = "Demo" + Math.floor(Math.random() * 9000 + 1000);
await p.goto(B + "/kirish");
const reg = await p.request.post(B + "/api/auth/register", {
  data: { nickname: nick, pin: "8351", role: "student", classCode: "DEMO23", grade: 7 },
});
console.log("register:", reg.status());
await shot("4-panel", "/panel");
await shot("5-yechish", "/yechish");

// masala yechish jarayonini KO'RSATAMIZ
await p.goto(B + "/yechish", { waitUntil: "networkidle" });
await p.fill("textarea", "12 va 18 sonlarining eng katta umumiy bolyuvchisini top");
await p.getByRole("button", { name: /Tushuntir/i }).click();
await p.waitForTimeout(19000);
await p.screenshot({ path: `${OUT}/6-yechish-natija.png`, fullPage: true });
console.log("shot: 6-yechish-natija");

await shot("7-duel", "/duel");

// 3. o'qituvchi paneli
await p.request.post(B + "/api/auth/logout");
const t = await p.request.post(B + "/api/auth/login", { data: { nickname: "UstozAziza", pin: "1234" } });
console.log("ustoz login:", t.status());
await shot("8-ustoz", "/ustoz");

await browser.close();
