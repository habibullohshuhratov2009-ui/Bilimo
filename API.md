# Sinf AI — API shartnomasi (UI shunga tayanadi)

Barcha javoblar JSON. Xato: `{ok:false, error:"..."}` + HTTP kod.

| Metod | Yo'l | Kirish | Chiqish |
|---|---|---|---|
| GET  | /api/health | — | `{ok, db}` (migratsiyani ham ishga tushiradi) |
| POST | /api/auth/register | `{nickname, pin, role:'student'|'teacher', classCode?, className?, grade?, inviteCode?}` | `{ok, classCode, className}` |
| POST | /api/auth/login | `{nickname, pin}` | `{ok}` |
| POST | /api/auth/logout | — | `{ok}` |
| GET  | /api/me | — | `{ok, user:{id,nickname,role,class_id,grade}, coins, class:{name,code}, topic:{id,title,subject}, leaderboard:[{nickname,coins,streak}]}` |
| POST | /api/solve | `{text}` | `{ok, explanation (markdown), quizId, questions:[{q,options[4],correct,why}]}` |
| POST | /api/quiz/submit | `{quizId, answers:number[], durationMs?}` | `{ok, correct, total, coins, balance}` |
| POST | /api/duel/create | `{topic?}` | `{ok, code, quizId, questions[]}` |
| POST | /api/duel/join | `{code}` | `{ok, duelId, quizId, questions[]}` |
| POST | /api/duel/finish | `{code, score}` | `{ok, winnerId, balance}` |
| GET  | /api/teacher/class | — | `{ok, class:{id,name,code}, students:[{nickname,coins,streak,attempts,correct}], topic}` |
| POST | /api/teacher/topic | `{title, subject?}` | `{ok, topicId}` |

Tanga: to'g'ri javob +5 · duel o'yin +5 · duel g'alaba +25 · taklif +30/+20 · kirish sovg'asi +10.
