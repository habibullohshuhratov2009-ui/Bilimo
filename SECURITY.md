# Bilimo — xavfsizlik (bolalar ilovasi uchun)

Bu maktab bolalari uchun mahsulot, shuning uchun eng kam ma'lumot prinsipi.

| Xavf | Qanday yopilgan |
|---|---|
| Shaxsiy ma'lumot sizib chiqishi | Ism-familiya, telefon, manzil, tug'ilgan sana **so'ralmaydi**. Faqat nickname + PIN + sinf kodi |
| PIN o'g'irlanishi | PIN **scrypt** (tuz bilan, sekin funksiya) sifatida saqlanadi. Ochiq matn hech qayerda yo'q |
| PIN ni terib topish (brute-force) | Bitta IP dan kirishga daqiqasiga 10 urinish, ro'yxatdan o'tishga 5. Oshsa — 429 |
| Oson PIN | 1234, 0000, 1111 kabi PIN lar taqiqlangan |
| Nik bor-yo'qligini aniqlash | Xato xabari bir xil: "Nik yoki PIN xato" |
| Sessiyani soxtalashtirish | Cookie HMAC bilan imzolangan, `httpOnly`, productionda `secure`, `sameSite=lax` |
| Ball/tanga aldash | To'g'ri javoblar **serverda** solishtiriladi, tanga faqat `coin_ledger` ga qo'shiladi (append-only), balans SUM bilan hisoblanadi |
| SQL injection | Barcha so'rovlar parametrli (`$1, $2`), satr yopishtirilmaydi |
| XSS / clickjacking | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` |
| AI ni bo'sh chaqirib pul yoqish | Bitta o'quvchiga daqiqasiga 6 ta AI so'rovi, duelga 5 ta |
| Kalitlar sizib chiqishi | `ANTHROPIC_API_KEY` faqat serverda, brauzerga hech qachon tushmaydi; `.env` git ga kirmaydi |
| Ma'lumotni o'chirish | Foydalanuvchi `is_deleted` bilan yumshoq o'chiriladi, tarix buzilmaydi |

Hali qilinmagani (halol ro'yxat): ikki bosqichli tasdiq, kapcha, audit-log ko'rish oynasi,
o'quvchi ma'lumotini eksport/o'chirish tugmasi. Bular keyingi bosqich.
