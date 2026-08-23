import { useState } from "react";
import { IconBulb, IconCoinS, IconSwords } from "@/components/app/icons";
import { useI18n, type Key } from "@/lib/i18n";

const STEPS: { icon: typeof IconBulb; title: Key; text: Key }[] = [
  { icon: IconBulb, title: "onb.1.title", text: "onb.1.text" },
  { icon: IconCoinS, title: "onb.2.title", text: "onb.2.text" },
  { icon: IconSwords, title: "onb.3.title", text: "onb.3.text" },
];

/** Ro'yxatdan o'tgandan keyin bir marta ko'rsatiladigan 3 qadamli tanishtiruv. */
export default function Onboarding({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 sm:items-center sm:pb-0">
      <div className="fx-rise w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5]">
          <Icon size={32} />
        </span>
        <h2 className="mt-4 text-xl font-extrabold">{t(s.title)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{t(s.text)}</p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-[#4F46E5]" : "w-2 bg-[#CBD5E1]"}`}
            />
          ))}
        </div>

        <button
          onClick={() => (last ? onClose() : setStep(step + 1))}
          className="mt-5 h-12 w-full rounded-2xl bg-[#4F46E5] text-base font-extrabold text-white transition-transform active:scale-[0.98]"
        >
          {last ? t("onb.start") : t("onb.next")}
        </button>
        {!last && (
          <button onClick={onClose} className="mt-2 h-11 w-full text-sm font-semibold text-[#94A3B8]">
            {t("onb.skip")}
          </button>
        )}
      </div>
    </div>
  );
}
