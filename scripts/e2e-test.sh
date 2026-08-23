#!/bin/bash
B=http://localhost:3000
R=$RANDOM
j() { python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps(d,ensure_ascii=False)[:220])"; }
echo "════ ROLLAR BO'YICHA TEST ════"
echo "--1 O'qituvchi ro'yxatdan o'tadi"
curl -s -c t.jar -H 'content-type: application/json' -d "{\"nickname\":\"Ustoz$R\",\"pin\":\"8391\",\"role\":\"teacher\",\"className\":\"7-B sinf\"}" $B/api/auth/register | tee t_reg.json | j
CODE=$(python3 -c "import json;print(json.load(open('t_reg.json')).get('classCode',''))")
echo "   sinf kodi: $CODE"
echo "--2 O'qituvchi kunlik mavzu qo'yadi"
curl -s -b t.jar -H 'content-type: application/json' -d '{"title":"Kasrlar","subject":"Matematika"}' $B/api/teacher/topic | j
echo "--3 O'quvchi A qo'shiladi"
curl -s -c a.jar -H 'content-type: application/json' -d "{\"nickname\":\"Ali$R\",\"pin\":\"5567\",\"role\":\"student\",\"classCode\":\"$CODE\",\"grade\":7}" $B/api/auth/register | j
echo "--4 O'quvchi profili (/api/me)"
curl -s -b a.jar $B/api/me | python3 -c "import json,sys;d=json.load(sys.stdin);print('coins:',d.get('coins'),'| sinf:',(d.get('class') or {}).get('name'),'| mavzu:',(d.get('topic') or {}).get('title'),'| reyting:',len(d.get('leaderboard') or []))"
echo "--5 AI masala yechadi"
curl -s -b a.jar -H 'content-type: application/json' -d '{"text":"3/4 + 1/4 nechaga teng"}' $B/api/solve > a_solve.json
python3 -c "
import json;d=json.load(open('a_solve.json'))
print('   ok:',d.get('ok'),'| quizId:',d.get('quizId'),'| savollar:',len(d.get('questions') or []))
print('   tushuntirish boshi:',(d.get('explanation') or '')[:90].replace(chr(10),' '))
json.dump(d,open('a_quiz.json','w'))"
echo "--6 Testni TO'G'RI javoblar bilan topshiradi"
python3 -c "
import json;d=json.load(open('a_quiz.json'))
print(json.dumps({'quizId':d['quizId'],'answers':[q['correct'] for q in d['questions']],'durationMs':9000}))" > sub.json
curl -s -b a.jar -H 'content-type: application/json' -d @sub.json $B/api/quiz/submit | j
echo "--7 Duel yaratadi"
curl -s -b a.jar -H 'content-type: application/json' -d '{}' $B/api/duel/create > duel.json
DCODE=$(python3 -c "import json;print(json.load(open('duel.json')).get('code',''))")
echo "   duel kodi: $DCODE | savollar: $(python3 -c "import json;print(len(json.load(open('duel.json')).get('questions') or []))")"
echo "--8 O'quvchi B qo'shilib duelga kiradi"
curl -s -c b.jar -H 'content-type: application/json' -d "{\"nickname\":\"Bek$R\",\"pin\":\"7742\",\"role\":\"student\",\"classCode\":\"$CODE\",\"grade\":7}" $B/api/auth/register > /dev/null
curl -s -b b.jar -H 'content-type: application/json' -d "{\"code\":\"$DCODE\"}" $B/api/duel/join | j
echo "--9 Ikkalasi duelni tugatadi"
curl -s -b b.jar -H 'content-type: application/json' -d "{\"code\":\"$DCODE\",\"score\":3}" $B/api/duel/finish | j
curl -s -b a.jar -H 'content-type: application/json' -d "{\"code\":\"$DCODE\",\"score\":5}" $B/api/duel/finish | j
echo "--10 O'qituvchi sinfni ko'radi"
curl -s -b t.jar $B/api/teacher/class | python3 -c "
import json,sys;d=json.load(sys.stdin)
print('   sinf:',(d.get('class') or {}).get('name'),'| o\'quvchilar:',len(d.get('students') or []))
for s in (d.get('students') or [])[:3]: print('   -',s['nickname'],'tanga',s['coins'],'urinish',s['attempts'],'to\'g\'ri',s['correct'])"
echo "$CODE" > class_code.txt; echo "$DCODE" > duel_code.txt
