"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Coin from "@/components/ui/Coin";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { copyText } from "@/components/ui/CopyButton";
import DashShell, { type NavItem } from "@/components/dash/DashShell";
import Stat from "@/components/dash/Stat";
import Shop from "@/components/dash/Shop";
import Onboarding from "@/components/app/Onboarding";
import "@/components/app/fx.css";
import {
  IconBook,
  IconBulb,
  IconCheck,
  IconCoinS,
  IconFlame,
  IconHome,
  IconMedal,
  IconSwords,
  IconTrophy,
  IconUserPlus,
  IconUsers,
} from "@/components/app/icons";
import { useI18n } from "@/lib/i18n";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";

type Me = {
  ok: boolean;
  user: {
    id: number;
    nickname: string;
    name?: string;
    role: string;
    class_id: number | null;
    grade: number | null;
  };
  coins: number;
  class: { name: string; code: string } | null;
  topic: { id: number; title: string; subject: string | null } | null;
  leaderboard: { nickname: string; name?: string; coins: number | string; streak: number | string }[];
};

const ONB_KEY = "blimo_onb_v1";
const MEDAL_TONE = ["text-[#EAB308]", "text-[#94A3B8]", "text-[#B45309]"];

export default function PanelPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOnb, setShowOnb] = useState(false);
  const [section, setSection] = useState("home");

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONB_KEY)) setShowOnb(true);
    } catch {
      /* localStorage yopiq bo'lsa — onboarding ko'rsatilmaydi, sahifa ishlayveradi */
    }
  }, []);

  const closeOnb = useCallback(() => {
    setShowOnb(false);
    try {
      localStorage.setItem(ONB_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Ketma-ket 401 hisoblagichi: bitta tasodifiy 401 dan foydalanuvchini CHIQARIB YUBORMAYMIZ.
  const unauth = useRef(0);

  const load = useCallback(
    (silent = false) => {
      fetch("/api/me")
        .then(async (r) => {
          if (r.status === 401) {
            unauth.current += 1;
            // Faqat ishonch hosil qilgach chiqaramiz (tarmoq sakrashi sabab emas).
            if (unauth.current >= 2 || !silent) router.replace("/kirish");
            return null;
          }
          unauth.current = 0;
          return r.json();
        })
        .then((data) => {
          if (!data) return;
          if (data.ok) {
            setMe(data);
            setError("");
          } else if (!silent) setError(data.error ?? t("common.error"));
        })
        .catch(() => {
          // Fonda yangilash yiqilsa — ekrandagi ma'lumot QOLADI, xato ko'rsatilmaydi.
          if (!silent) setError(t("common.error"));
        });
    },
    [router, t]
  );

  useEffect(() => load(), [load]);

  const refresh = useCallback(() => load(true), [load]);
  useAutoRefresh(refresh, 15_000);

  async function inviteFriend() {
    if (!me) return;
    await copyText(
      `${location.origin}/kirish?invite=${encodeURIComponent(me.user.nickname.toUpperCase())}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/kirish");
  }

  if (error && !me) {
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

  if (!me) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F5F6FF]">
        <Spinner size={36} />
      </main>
    );
  }

  const myIndex = me.leaderboard.findIndex((r) => r.nickname === me.user.nickname);
  const myStreak = Number(me.leaderboard[myIndex]?.streak ?? 0);
  const displayName = me.user.name ?? me.user.nickname;

  const nav: NavItem[] = [
    { id: "home", label: t("nav.student.home"), icon: <IconHome size={20} /> },
    { id: "ask", label: t("nav.student.ask"), icon: <IconBulb size={20} /> },
    { id: "duel", label: t("nav.student.duel"), icon: <IconSwords size={20} /> },
    { id: "rating", label: t("nav.student.rating"), icon: <IconTrophy size={20} /> },
    { id: "shop", label: t("nav.student.shop"), icon: <IconMedal size={20} /> },
  ];

  // "ask" va "duel" — alohida sahifalar, qolganlari shu paneldagi bo'limlar.
  function select(id: string) {
    if (id === "ask") return router.push("/yechish");
    if (id === "duel") return router.push("/duel");
    setSection(id);
  }

  return (
    <>
      {showOnb && <Onboarding onClose={closeOnb} />}
      <DashShell
        title={t("student.greeting", { name: displayName })}
        subtitle={
          me.class ? `${me.class.name} · ${t("student.classCode")}: ${me.class.code}` : undefined
        }
        nav={nav}
        active={section}
        onSelect={select}
        userName={displayName}
        userMeta={
          <span className="inline-flex items-center gap-1">
            <Coin size={14} /> {Number(me.coins)}
          </span>
        }
        onLogout={logout}
      >
        {section === "home" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={<IconCoinS size={20} />} value={Number(me.coins)} label={t("student.coins")} tone="coin" />
              <Stat icon={<IconFlame size={20} />} value={myStreak} label={t("student.streak")} tone="rose" />
              <Stat
                icon={<IconTrophy size={20} />}
                value={myIndex >= 0 ? myIndex + 1 : 0}
                label={t("student.rating")}
              />
              <Stat
                icon={<IconUsers size={20} />}
                value={me.leaderboard.length}
                label={t("teacher.students")}
                tone="mint"
              />
            </div>

            <Card className="flex items-center gap-3 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                <IconBook size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#64748B]">{t("student.todayTopic")}</p>
                <p className="truncate font-bold">
                  {me.topic ? me.topic.title : t("student.noTopic")}
                  {me.topic?.subject && (
                    <span className="font-semibold text-[#64748B]"> · {me.topic.subject}</span>
                  )}
                </p>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => router.push("/yechish")}
                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-[#4F46E5] px-5 text-left font-extrabold text-white shadow-[0_4px_0_#3730A3] transition-all hover:bg-[#4338CA] active:translate-y-[3px] active:shadow-[0_1px_0_#3730A3]"
              >
                <IconBulb size={24} /> {t("student.askButton")}
              </button>
              <button
                onClick={() => router.push("/duel")}
                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl bg-[#FACC15] px-5 text-left font-extrabold text-[#713F12] shadow-[0_4px_0_#A16207] transition-all hover:bg-[#EAB308] active:translate-y-[3px] active:shadow-[0_1px_0_#A16207]"
              >
                <IconSwords size={24} /> {t("student.duelButton")}
              </button>
              <button
                onClick={inviteFriend}
                className={`flex min-h-[4.5rem] items-center gap-3 rounded-2xl border-2 px-5 text-left font-extrabold transition-colors ${
                  copied
                    ? "border-[#16A34A] bg-[#16A34A] text-white"
                    : "border-[#DFE4FF] bg-white text-[#4F46E5] hover:bg-[#FBFCFF]"
                }`}
              >
                {copied ? <IconCheck size={24} /> : <IconUserPlus size={24} />}
                {copied ? t("common.copied") : t("student.invite")}
              </button>
            </div>
          </div>
        )}

        {section === "rating" && (
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <IconTrophy size={20} /> {t("student.rating")}
            </h2>
            {me.leaderboard.length === 0 ? (
              <p className="text-sm text-[#64748B]">{t("common.empty")}</p>
            ) : (
              <ol className="flex flex-col gap-1.5">
                {me.leaderboard.slice(0, 20).map((row, i) => {
                  const isMe = row.nickname === me.user.nickname;
                  return (
                    <li
                      key={row.nickname}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                        isMe ? "border-2 border-[#4F46E5]/30 bg-indigo-50" : "bg-slate-50"
                      }`}
                    >
                      <span className="grid w-8 place-items-center font-extrabold">
                        {i < 3 ? (
                          <IconMedal size={20} className={MEDAL_TONE[i]} />
                        ) : (
                          <span className="text-sm text-[#94A3B8]">{i + 1}</span>
                        )}
                      </span>
                      <span className="flex-1 truncate font-bold">
                        {row.name ?? row.nickname}
                        {isMe && (
                          <span className="ml-1 text-xs font-extrabold text-[#4F46E5]">
                            ({t("student.you")})
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 font-extrabold tabular-nums">
                        <Coin size={18} /> {Number(row.coins)}
                      </span>
                      <span className="flex w-12 items-center justify-end gap-0.5 text-sm font-semibold tabular-nums text-[#64748B]">
                        <IconFlame size={14} />
                        {Number(row.streak)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        )}

        {section === "shop" && <Shop coins={Number(me.coins)} onChanged={refresh} />}
      </DashShell>
    </>
  );
}
