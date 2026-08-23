# Blimo — maktab o'quvchilari uchun AI repetitor va tanga o'yini

Oddiy maktab uchun ilova: o'quvchi savolini yozadi — AI **o'zbek tilida qadam-baqadam**
tushuntiradi, keyin mini-test beradi. To'g'ri javob — **tanga**. Sinfdoshi bilan **duel**
o'ynaydi. O'qituvchi sinf kodini beradi, kunlik mavzu qo'yadi va kim qanday ishlayotganini ko'radi.

## Nega bu kerak
45 daqiqalik darsni 30 o'quvchiga bo'lsak — bitta bolaga 1,5 daqiqa qoladi.
Repetitorga hamma ham pul to'lay olmaydi. Blimo — har bolaga alohida sabrli ustoz,
telefonda, bepul, o'zbek tilida.

## Ishga tushirish
```bash
npm install            # Node 22+ kerak (.nvmrc)
cp .env.example .env.local        # ANTHROPIC_API_KEY va DATABASE_URL to'ldiriladi
createdb sinfai
psql -d sinfai -f src/lib/db/schema.sql
npm run dev                        # http://localhost:3000
```
Demo ma'lumot: `DATABASE_URL=... node scripts/seed.mjs` → sinf kodi **DEMO23**,
o'qituvchi `UstozAziza`, o'quvchilar Diyor/Malika/Javohir/Nilufar/Sardor (PIN 1234).

## Tekshirish
```bash
npx tsc --noEmit                 # tiplar
npm run build                    # yig'ilish
bash scripts/e2e-test.sh         # to'liq yo'l: o'qituvchi -> o'quvchi -> AI -> test -> duel -> hisobot
bash scripts/security-test.sh    # o'ziga hujum: SQLi, soxta cookie, rol chegarasi, brute-force, prompt injection
node scripts/shots.mjs           # barcha ekranlarning skrinshotlari (Playwright)
```

## Texnologiya
Next.js 16.3.2 (App Router) · TypeScript · Tailwind · **PostgreSQL** · Anthropic Claude API · PWA.
Deploy: Railway. Telefon va Windows uchun qobiqlar: `~/sinf-ai-wrap` (APK + NSIS installer).

## Hujjatlar
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — qatlamlar va ma'lumot oqimi (kim kimga qaraydi, ma'lumot qayerdan qayerga boradi)
- [`API.md`](./API.md) — barcha endpointlar shartnomasi
- [`SECURITY.md`](./SECURITY.md) — xavf va u qanday yopilgani

## Muhim yechimlar
- **Tanga append-only jurnal** (`coin_ledger`): balans `SUM(delta)` bilan hisoblanadi — hech kim balansni "qo'lda" oshira olmaydi.
- **Javob kaliti mijozga yuborilmaydi**: test savollari `correct` maydonisiz ketadi, kalit faqat topshirgandan keyin razbor uchun qaytadi.
- **Ball serverda sanaladi** (test ham, duel ham) — brauzerdan kelgan raqamga ishonilmaydi.
- **Prompt injection**: o'quvchi matni AI ga *ma'lumot* sifatida beriladi, ichidagi "ko'rsatmalarni unut" kabi buyruqlar bajarilmaydi.
- **`events` jadvali** — keyin maktab va vazirlik uchun hisobot shu yerdan chiqadi.
