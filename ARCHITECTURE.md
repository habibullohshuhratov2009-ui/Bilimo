# Blimo — arxitektura va ma'lumot oqimi

> Hakaton final, 23.08.2026. Bu hujjat "ma'lumot qayerdan keladi, qayerga boradi" degan savolga javob beradi.

## 1. Qatlamlar (file structure — nega shunday)

```
src/
  app/                      # faqat MARSHRUT va EKRAN. Biznes-mantiq bu yerda TURMAYDI.
    page.tsx                #   lending (SEO, hakam birinchi ko'radi)
    kirish/ panel/ yechish/ duel/ ustoz/ yordam/
    api/                    #   HTTP chegara: validatsiya -> lib chaqirig'i -> JSON
  lib/
    config/env.ts           # ENV bitta joyda, yo'q bo'lsa DARHOL xato beradi
    db/pool.ts              # bitta Pool (global) — serverless qayta yuklashda dubl ochilmaydi
    db/schema.sql           # yagona haqiqat manbai (SQL), ORM yo'q — ortiqcha qatlam kerak emas
    db/migrate.ts           # /api/health chaqirilganda idempotent ishga tushadi
    db/queries/*.ts         # SQL FAQAT shu yerda (coins.ts, events.ts)
    ai/prompts.ts           # barcha prompt matni bitta faylda — o'zgartirish oson
    ai/claude.ts            # Anthropic bilan yagona aloqa nuqtasi + JSON parser
    auth/session.ts         # imzolangan cookie, PIN sha256
  components/ui/            # qayta ishlatiladigan ko'rinish bo'laklari
```

Qoida: `app/` -> `lib/` ga qarashi mumkin, `lib/` hech qachon `app/` ga qaramaydi. Shuning uchun
mantiqni test qilish yoki keyin mobil ilovaga ko'chirish uchun UI ni qayta yozish shart emas.

## 2. Ma'lumot oqimi — o'quvchi masala yechganda

```
Bola (telefon)
   │  matn: "5x + 3 = 18"
   ▼
POST /api/solve  ──► auth/session.ts: cookie -> user  (kirmagan bo'lsa 401)
   │
   ├─► ai/claude.ts  ──►  Anthropic API  (system: EXPLAIN_SYSTEM, o'zbekcha, qadam-baqadam)
   │        └── javob matni + token soni
   │
   ├─► DB: explanations (user_id, input_text, output_md, model, tokenlar)
   │
   ├─► ai/claude.ts  ──►  Anthropic API  (system: QUIZ_SYSTEM -> JSON test)
   │        └── parseQuiz(): JSON qattiq tekshiriladi (4 variant, correct 0..3)
   │
   ├─► DB: quizzes (questions JSONB)
   └─► DB: events (type='solve')            ← keyingi hisobot shu yerdan
   ▼
Ekranda: tushuntirish + 3 savol
   │  bola javob beradi
   ▼
POST /api/quiz/submit
   ├─► DB: quizzes dan to'g'ri javoblar OLINADI (mijozga ishonilmaydi — ball serverda sanaladi)
   ├─► DB: attempts (correct/total/vaqt)
   ├─► DB: coin_ledger (+5 × to'g'ri javob)   ← BALANS UPDATE QILINMAYDI
   └─► javob: nechta to'g'ri, nechta tanga, yangi balans (SUM(delta))
```

## 3. Duel oqimi (viral halqa)

```
A bola: POST /api/duel/create ──► AI 5 savol tuzadi ──► quizzes + duels(code, player_a)
        └── ekranda KOD (masalan 7K2QM) -> do'stiga yuboradi
B bola: POST /api/duel/join {code} ──► duels.player_b, status='playing', o'sha savollar
Ikkalasi: POST /api/duel/finish {code, score}
        ├── har biriga +5 (o'ynagani uchun)
        ├── ikkala ball kelganda: g'olib aniqlanadi -> +25
        └── durang bo'lsa g'olib yo'q
```
Nega viral: bola do'stini "ro'yxatdan o't" deb emas, "duel o'ynaymizmi" deb chaqiradi.
Taklif havolasi ishlatilsa — taklif qilganga +30, kelganiga +20 (invites jadvali).

## 4. O'qituvchi oqimi

```
O'qituvchi ro'yxatdan o'tadi ──► classes (avtomatik KOD) ──► kodni sinfga aytadi
POST /api/teacher/topic  -> topics (eski mavzu is_active=false, yangisi true)
GET  /api/teacher/class  -> sinf ro'yxati: tanga, streak, urinish soni, to'g'ri javoblar
```
Bola duel/test qilganda AI savollari SHU kunlik mavzudan tuziladi — ya'ni o'qituvchi
darsni boshqaradi, AI esa mashq qildiradi.

## 5. Nega tanga "ledger" (append-only)

`coin_ledger` ga faqat QO'SHILADI, hech qachon o'zgartirilmaydi. Balans = `SUM(delta)`.
Natija: (a) har tanga qayerdan kelgani ko'rinadi, (b) balansni "qo'lda" oshirib bo'lmaydi,
(c) keyin "shu oy sinf nechta tanga ishladi" degan hisobot bitta so'rov bilan chiqadi.

## 6. Keyingi bosqich — maktab va vazirlik

`events` jadvali (append-only) barcha harakatni yozadi. Shundan:
- maktab uchun: qaysi mavzu bo'yicha sinf ko'p xato qilyapti;
- tuman/vazirlik uchun: nechta bola faol, qaysi fanlar cho'kyapti.
Mahsulot bolaga BEPUL qoladi — hisobot qatlami muassasa uchun.

## 7. Xavfsizlik va bolalar ma'lumoti

- Telefon raqami, ism-familiya, manzil SO'RALMAYDI. Faqat nickname + PIN + sinf kodi.
- PIN sha256 bilan saqlanadi, ochiq matnda emas.
- Sessiya HMAC bilan imzolangan httpOnly cookie.
- Test ballari faqat serverda hisoblanadi.
- AI kalitlari faqat serverda (`.env`), brauzerga hech qachon tushmaydi.
