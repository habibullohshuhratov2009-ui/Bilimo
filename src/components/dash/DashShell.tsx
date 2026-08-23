import type { ReactNode } from "react";
import Mascot from "@/components/ui/Mascot";
import LangSwitch from "@/components/app/LangSwitch";
import { IconLogout } from "@/components/app/icons";
import { useI18n } from "@/lib/i18n";

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type Props = {
  /** Panel sarlavhasi — "O'qituvchi paneli" / "O'quvchi paneli" */
  title: string;
  /** Sarlavha ostidagi qator — sinf nomi, salomlashish va h.k. */
  subtitle?: string;
  nav: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  /** Yon panel pastidagi blok: ism, tanga soni */
  userName: string;
  userMeta?: ReactNode;
  onLogout: () => void;
  /** Sarlavha yonidagi qo'shimcha (masalan, sinf kodi) */
  headerRight?: ReactNode;
  children: ReactNode;
};

/**
 * Dashboard karkasi: kompyuterda chapda doimiy menyu, telefonda pastda tab-panel.
 * Ilgari panellar `max-w-md` mobil ustun edi — kompyuterda siqilib ko'rinardi.
 */
export default function DashShell({
  title,
  subtitle,
  nav,
  active,
  onSelect,
  userName,
  userMeta,
  onLogout,
  headerRight,
  children,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-[#F5F6FF] text-[#0F172A] lg:grid lg:grid-cols-[264px_1fr]">
      {/* ——— Yon menyu (kompyuter) ——— */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Mascot mood="happy" size={34} animated={false} />
          <span className="text-lg font-extrabold tracking-tight">
            Blim<span className="text-[#4F46E5]">o</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const on = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                aria-current={on ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  on
                    ? "bg-[#EEF2FF] text-[#4F46E5]"
                    : "text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                <span className={on ? "text-[#4F46E5]" : "text-[#94A3B8]"}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-slate-100 p-3">
          <LangSwitch className="w-full justify-center" />
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="truncate text-sm font-bold">{userName}</p>
            {userMeta && <div className="mt-0.5 text-xs text-[#64748B]">{userMeta}</div>}
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-[#DC2626]"
          >
            <IconLogout size={18} /> {t("common.logout")}
          </button>
        </div>
      </aside>

      {/* ——— Kontent ——— */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="lg:hidden">
                <Mascot mood="happy" size={30} animated={false} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-extrabold leading-tight lg:text-xl">{title}</h1>
                {subtitle && <p className="truncate text-xs text-[#64748B]">{subtitle}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerRight}
              <span className="lg:hidden">
                <LangSwitch />
              </span>
              <button
                onClick={onLogout}
                aria-label={t("common.logout")}
                className="grid h-11 w-11 place-items-center rounded-xl text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-[#DC2626] lg:hidden"
              >
                <IconLogout size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-7">
          {children}
        </main>
      </div>

      {/* ——— Pastki tab-panel (telefon) ——— */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg">
          {nav.map((item) => {
            const on = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 pb-[env(safe-area-inset-bottom)] text-[10px] font-bold transition-colors ${
                  on ? "text-[#4F46E5]" : "text-[#94A3B8]"
                }`}
              >
                {item.icon}
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
