/** Muhit o'zgaruvchilari — bitta joyda, ishga tushishda tekshiriladi. */
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`ENV yo'q: ${name}`);
  return v;
}
export const env = {
  databaseUrl: () => need("DATABASE_URL"),
  anthropicKey: () => need("ANTHROPIC_API_KEY"),
  model: process.env.AI_MODEL ?? "claude-sonnet-5",
  appName: "Sinf AI",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
