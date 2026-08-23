// Dashboardlarni ko'z bilan tekshirish: kompyuter (1440) va telefon (390) o'lchamda.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const B = process.env.BASE ?? "http://localhost:3100";
const OUT = new URL("../.shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();

async function shoot(who, nickname, pin, path, sections, size, tag) {
  const ctx = await b.newContext({ viewport: size, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const r = await p.request.post(B + "/api/auth/login", { data: { nickname, pin } });
  if (!r.ok()) {
    console.log(`  ✗ ${who} login: ${r.status()}`);
    await ctx.close();
    return;
  }
  await ctx.addCookies((await p.request.storageState()).cookies);
  await p.goto(B + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  // onboarding oynasi chiqsa — yopamiz
  const skip = p.locator("text=/O'tkazib yuborish|Пропустить/").first();
  if (await skip.count()) await skip.click().catch(() => {});
  for (const s of sections) {
    if (s.label) {
      const btn = p.locator(`button:has-text("${s.label}")`).first();
      if (await btn.count()) await btn.click().catch(() => {});
      await p.waitForTimeout(700);
    }
    await p.screenshot({ path: `${OUT}${tag}-${who}-${s.name}.png`, fullPage: true });
    console.log(`  ✓ ${tag}/${who}/${s.name}`);
  }
  await ctx.close();
}

const teacherSections = [
  { name: "overview" },
  { name: "analytics", label: "Analitika" },
  { name: "students", label: "O'quvchilar" },
  { name: "ai", label: "AI hisobot" },
];
const studentSections = [
  { name: "home" },
  { name: "rating", label: "Reyting" },
  { name: "shop", label: "Do'kon" },
];

console.log("──── KOMPYUTER 1440x900 ────");
await shoot("ustoz", "UstozAziza", "1234", "/ustoz", teacherSections, { width: 1440, height: 900 }, "pc");
await shoot("oquvchi", "Diyor", "1234", "/panel", studentSections, { width: 1440, height: 900 }, "pc");

console.log("──── TELEFON 390x844 ────");
await shoot("ustoz", "UstozAziza", "1234", "/ustoz", teacherSections, { width: 390, height: 844 }, "mob");
await shoot("oquvchi", "Diyor", "1234", "/panel", studentSections, { width: 390, height: 844 }, "mob");

await b.close();
