/**
 * Sinf nomidan sinf raqamini ajratish: "11-V sinf" -> 11, "7-A" -> 7, "5 sinf" -> 5.
 * Topilmasa yoki 1..11 oralig'idan tashqarida bo'lsa — null.
 *
 * Nega kerak: o'quvchi o'zi "nechanchi sinf" deb tanlaganda o'qituvchining sinfi bilan
 * ziddiyat chiqardi (ustozda 11-V, o'quvchi o'zini 7-sinf deb yozardi). Endi sinf raqami
 * BITTA manbadan — o'qituvchi ochgan sinf nomidan — olinadi.
 */
export function parseGrade(className: string | null | undefined): number | null {
  if (!className) return null;
  const m = className.match(/\d{1,2}/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isInteger(n) && n >= 1 && n <= 11 ? n : null;
}
