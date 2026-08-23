"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Coin from "@/components/ui/Coin";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { copyText } from "@/components/ui/CopyButton";
import DashShell, { type NavItem } from "@/components/dash/DashShell";
import Stat from "@/components/dash/Stat";
import "@/components/app/fx.css";
import {
  IconBook,
  IconChart,
  IconCheck,
  IconClipboard,
  IconFlame,
  IconHome,
  IconKey,
  IconSearch,
  IconSparkles,
  IconTarget,
  IconUsers,
} from "@/components/app/icons";
import { useI18n } from "@/lib/i18n";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";

type Student = {
  id: number;
  nickname: string;
  name?: string;
  coins: number | string;
  streak: number | string;
  attempts: number | string;
  correct: number | string;
  total?: number | string;
  questions?: number | string;
  last_active?: string | null;
};

type ClassData = {
  ok: boolean;
  error?: string;
  class: { id: number; name: string; code: string; grade: number | null };
  students: Student[];
  topic: { title: string; subject: string | null } | null;
};

const num = (v: unknown) => Number(v ?? 0);
const pct = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) : 0);
const isToday = (d?: string | null) =>
  !!d && new Date(d).toDateString() === new Date().toDateString();

export default function UstozPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [data, setData] = useState<ClassData | null>(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState("overview");

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  const [codeCopied, setCodeCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [resetInfo, setResetInfo] = useState<{ student: string; pin: string } | null>(null);
  const [resetBusy, setResetBusy] = useState<number | null>(null);

  const [aiReport, setAiReport] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  // Bitta tasodifiy 401/403 dan o'qituvchini chiqarib yubormaymiz.
  const unauth = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      try {
        const res = await fetch("/api/teacher/class");
        if (res.status === 401 || res.status === 403) {
          unauth.current += 1;
          if (unauth.current >= 2 || !silent) router.replace("/kirish?role=teacher");
          return;
        }
        unauth.current = 0;
        const d: ClassData = await res.json();
        if (d.ok) {
          setData(d);
          setError("");
        } else if (!silent) setError(d.error ?? t("common.error"));
      } catch {
        // Fonda yangilash yiqilsa — jadval joyida qoladi.
        if (!silent) setError(t("common.error"));
      }
    },
    [router, t]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Yangi o'quvchi qo'shilsa 10 soniyada o'zi paydo bo'ladi (qo'lda yangilash shart emas).
  const refresh = useCallback(() => load(true), [load]);
  useAutoRefresh(refresh, 10_000);

  async function askAi() {
    setAiBusy(true);
    setAiError("");
    try {
      const res = await fetch("/api/teacher/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || t("common.error"));
      setAiReport(String(j.report || ""));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setAiBusy(false);
    }
  }

  async function copyClassCode(code: string) {
    await copyText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2200);
  }

  async function saveTopic() {
    setFormError("");
    if (!title.trim()) {
      setFormError(t("teacher.topicNew"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), subject: subject.trim() || undefined }),
      });
      const d = await res.json();
      if (!d.ok) {
        setFormError(d.error ?? t("common.error"));
        return;
      }
      setTitle("");
      setSubject("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch {
      setFormError(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function resetPin(st: Student) {
    const label = st.name ?? st.nickname;
    if (!confirm(`${label}: ${t("teacher.resetPin")}?`)) return;
    setResetBusy(st.id);
    try {
      const res = await fetch("/api/teacher/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: st.id }),
      });
      const d = await res.json();
      if (d.ok) setResetInfo({ student: d.student, pin: d.pin });
      else setError(d.error ?? t("common.error"));
    } catch {
      setError(t("common.error"));
    } finally {
      setResetBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/kirish");
  }

  const students = useMemo(() => data?.students ?? [], [data]);

  const totals = useMemo(() => {
    const attempts = students.reduce((s, x) => s + num(x.attempts), 0);
    const correct = students.reduce((s, x) => s + num(x.correct), 0);
    const answered = students.reduce((s, x) => s + num(x.total), 0);
    const activeToday = students.filter((x) => isToday(x.last_active)).length;
    return { attempts, correct, answered, activeToday, accuracy: pct(correct, answered) };
  }, [students]);

  /** Har o'quvchi bo'yicha to'g'ri javob foizi — analitika uchun. */
  const ranked = useMemo(
    () =>
      students
        .map((s) => ({
          id: s.id,
          name: s.name ?? s.nickname,
          answered: num(s.total),
          accuracy: pct(num(s.correct), num(s.total)),
        }))
        .sort((a, b) => b.accuracy - a.accuracy),
    [students]
  );

  const filtered = useMemo(() => {
    const qq = query.trim().toLowerCase();
    if (!qq) return students;
    return students.filter((s) => (s.name ?? s.nickname).toLowerCase().includes(qq));
  }, [students, query]);

  if (error && !data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F5F6FF] px-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="font-semibold text-[#DC2626]">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => location.reload()}>
            {t("common.retry")}
          </Button>
        </Card>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F5F6FF]">
        <Spinner size={36} />
      </main>
    );
  }

  const nav: NavItem[] = [
    { id: "overview", label: t("nav.teacher.overview"), icon: <IconHome size={20} /> },
    { id: "analytics", label: t("nav.teacher.analytics"), icon: <IconChart size={20} /> },
    { id: "students", label: t("nav.teacher.students"), icon: <IconUsers size={20} /> },
    { id: "topic", label: t("nav.teacher.topic"), icon: <IconBook size={20} /> },
    { id: "ai", label: t("nav.teacher.ai"), icon: <IconSparkles size={20} /> },
  ];

  const statGrid = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={<IconUsers size={20} />} value={students.length} label={t("teacher.students")} />
      <Stat
        icon={<IconClipboard size={20} />}
        value={totals.attempts}
        label={t("teacher.attempts")}
        tone="coin"
      />
      <Stat
        icon={<IconTarget size={20} />}
        value={totals.accuracy}
        suffix="%"
        label={t("teacher.accuracy")}
        tone="mint"
      />
      <Stat
        icon={<IconFlame size={20} />}
        value={totals.activeToday}
        label={t("teacher.activeToday")}
        tone="rose"
      />
    </div>
  );

  return (
    <DashShell
      title={t("teacher.panelTitle")}
      subtitle={data.class.name}
      nav={nav}
      active={section}
      onSelect={setSection}
      userName={data.class.name}
      userMeta={`${t("student.classCode")}: ${data.class.code}`}
      onLogout={logout}
    >
      {section === "overview" && (
        <div className="space-y-5">
          {statGrid}

          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <Card className="border-0 bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] p-5 text-center text-white">
              <p className="text-sm font-semibold text-indigo-200">{t("teacher.classCodeHint")}</p>
              <button
                onClick={() => copyClassCode(data.class.code)}
                className="mt-3 w-full select-all rounded-2xl bg-white/15 py-4 text-4xl font-extrabold tracking-[0.25em] transition-colors hover:bg-white/25 lg:text-5xl"
              >
                {data.class.code}
              </button>
              <button
                onClick={() => copyClassCode(data.class.code)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/70 px-4 font-bold transition-colors hover:bg-white/10"
              >
                {codeCopied ? <IconCheck size={18} /> : <IconClipboard size={18} />}
                {codeCopied ? t("common.copied") : t("teacher.copyCode")}
              </button>
            </Card>

            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-extrabold">
                <IconBook size={20} /> {t("student.todayTopic")}
              </h2>
              <p className="mt-2 text-sm text-[#64748B]">
                {t("teacher.topicCurrent")}:{" "}
                <span className="font-bold text-[#0F172A]">
                  {data.topic ? data.topic.title : t("student.noTopic")}
                </span>
                {data.topic?.subject ? ` (${data.topic.subject})` : ""}
              </p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setSection("topic")}>
                {t("teacher.topicNew")}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {section === "analytics" && (
        <div className="space-y-5">
          {statGrid}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-extrabold">
              <IconChart size={20} /> {t("teacher.byStudent")}
            </h2>
            {ranked.every((r) => r.answered === 0) ? (
              <p className="mt-3 text-sm text-[#64748B]">{t("teacher.noData")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {ranked.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-[minmax(0,7rem)_1fr_3rem] items-center gap-3 lg:grid-cols-[minmax(0,12rem)_1fr_3rem]"
                  >
                    <span className="truncate text-sm font-bold">{r.name}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full transition-all"
                        style={{
                          width: `${r.answered ? r.accuracy : 0}%`,
                          background:
                            r.accuracy >= 70 ? "#16A34A" : r.accuracy >= 40 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                    </span>
                    <span className="text-right text-sm font-extrabold tabular-nums">
                      {r.answered ? `${r.accuracy}%` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-extrabold text-[#BE123C]">{t("teacher.lagging")}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {ranked
                  .filter((r) => r.answered > 0 && r.accuracy < 60)
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id} className="flex justify-between rounded-xl bg-rose-50 px-3 py-2">
                      <span className="font-bold">{r.name}</span>
                      <span className="font-extrabold tabular-nums">{r.accuracy}%</span>
                    </li>
                  ))}
                {!ranked.some((r) => r.answered > 0 && r.accuracy < 60) && (
                  <li className="text-[#64748B]">{t("common.empty")}</li>
                )}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="font-extrabold text-[#15803D]">{t("teacher.leading")}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {ranked
                  .filter((r) => r.answered > 0 && r.accuracy >= 60)
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id} className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2">
                      <span className="font-bold">{r.name}</span>
                      <span className="font-extrabold tabular-nums">{r.accuracy}%</span>
                    </li>
                  ))}
                {!ranked.some((r) => r.answered > 0 && r.accuracy >= 60) && (
                  <li className="text-[#64748B]">{t("common.empty")}</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {section === "students" && (
        <div className="space-y-4">
          <label className="relative block max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <IconSearch size={18} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("teacher.searchStudent")}
              className="min-h-12 w-full rounded-2xl border-2 border-slate-200 bg-white pl-11 pr-4 text-base outline-none transition-colors focus:border-[#4F46E5]"
            />
          </label>

          {resetInfo && (
            <Card className="border-2 border-[#4F46E5]/30 bg-[#EEF2FF] p-4">
              <p className="font-bold text-[#3730A3]">
                {t("teacher.newPin", { name: resetInfo.student, pin: resetInfo.pin })}
              </p>
              <button
                onClick={() => setResetInfo(null)}
                className="mt-2 min-h-11 text-sm font-semibold text-[#4F46E5]"
              >
                {t("common.close")}
              </button>
            </Card>
          )}

          <Card className="overflow-x-auto p-0">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#64748B]">{t("teacher.noStudents")}</p>
            ) : (
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase text-[#94A3B8]">
                    <th className="px-4 py-3">{t("teacher.colName")}</th>
                    <th className="px-4 py-3 text-right">{t("teacher.colCoins")}</th>
                    <th className="px-4 py-3 text-right">{t("teacher.colStreak")}</th>
                    <th className="px-4 py-3 text-right">{t("teacher.colAttempts")}</th>
                    <th className="px-4 py-3 text-right">{t("teacher.colCorrect")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 font-bold">
                        {s.name ?? s.nickname}
                        {isToday(s.last_active) && (
                          <span
                            title={t("teacher.activeToday")}
                            className="ml-2 inline-block h-2 w-2 rounded-full bg-[#16A34A] align-middle"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 font-extrabold tabular-nums">
                          <Coin size={14} /> {num(s.coins)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{num(s.streak)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{num(s.attempts)}</td>
                      <td className="px-4 py-3 text-right font-extrabold tabular-nums text-[#15803D]">
                        {num(s.total) ? `${pct(num(s.correct), num(s.total))}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => resetPin(s)}
                          disabled={resetBusy === s.id}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#64748B] transition-colors hover:bg-slate-50 hover:text-[#4F46E5] disabled:opacity-50"
                        >
                          <IconKey size={16} /> {t("teacher.resetPin")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {section === "topic" && (
        <Card className="max-w-xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <IconBook size={20} /> {t("student.todayTopic")}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {t("teacher.topicCurrent")}:{" "}
            <span className="font-bold text-[#0F172A]">
              {data.topic ? data.topic.title : t("student.noTopic")}
            </span>
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              label={t("teacher.topicNew")}
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label={t("teacher.topicSubject")}
              value={subject}
              maxLength={60}
              onChange={(e) => setSubject(e.target.value)}
            />
            {formError && (
              <div className="fx-shake rounded-2xl border-2 border-[#DC2626]/30 bg-red-50 px-4 py-3 text-sm font-semibold text-[#DC2626]">
                {formError}
              </div>
            )}
            <Button onClick={saveTopic} disabled={saving} variant={saved ? "success" : "primary"}>
              {saved ? t("teacher.topicSaved") : saving ? t("common.loading") : t("teacher.topicSave")}
            </Button>
          </div>
        </Card>
      )}

      {section === "ai" && (
        <Card className="max-w-3xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <IconSparkles size={20} /> {t("teacher.aiTitle")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#64748B]">{t("teacher.aiText")}</p>
          <Button onClick={askAi} disabled={aiBusy} className="mt-4 w-full sm:w-auto">
            {aiBusy ? t("teacher.aiBusy") : t("teacher.aiButton")}
          </Button>
          {aiError && (
            <div className="fx-shake mt-4 rounded-2xl border-2 border-[#DC2626]/30 bg-red-50 px-4 py-3 text-sm font-semibold text-[#DC2626]">
              {aiError}
            </div>
          )}
          {aiReport && (
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#F1F5F9] px-4 py-4 text-sm leading-relaxed">
              {aiReport}
            </div>
          )}
        </Card>
      )}
    </DashShell>
  );
}
