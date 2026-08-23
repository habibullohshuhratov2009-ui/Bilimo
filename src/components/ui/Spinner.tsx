export default function Spinner({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-label="Yuklanmoqda"
      className="inline-block animate-spin rounded-full border-[3px] border-[#4F46E5]/25 border-t-[#4F46E5]"
      style={{ width: size, height: size }}
    />
  );
}
