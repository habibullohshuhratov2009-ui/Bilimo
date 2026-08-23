import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sinf-ai.uz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bilimo — maktab o'quvchilari uchun AI repetitor",
    template: "%s | Bilimo",
  },
  description:
    "Bilimo — o'zbek tilida qadam-baqadam tushuntiradigan AI repetitor. Savol yoz, tushunib ol, mini-testda tanga yut va sinfdoshing bilan duel o'yna. O'qituvchi uchun sinf kodi va progress paneli.",
  keywords: [
    "AI repetitor",
    "o'zbek tilida AI",
    "maktab o'quvchisi",
    "onlayn ta'lim",
    "matematika yordamchi",
    "sinf",
    "tanga o'yini",
    "duel",
    "o'qituvchi paneli",
    "Bilimo",
  ],
  applicationName: "Bilimo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bilimo",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: SITE_URL,
    siteName: "Bilimo",
    title: "Bilimo — maktab o'quvchilari uchun AI repetitor",
    description:
      "O'zbek tilida qadam-baqadam tushuntiradigan AI ustoz: savol → tushuntirish → mini-test → tanga. Sinfdoshing bilan 1x1 duel!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bilimo — maktab o'quvchilari uchun AI repetitor",
    description:
      "O'zbek tilida AI ustoz: savol → tushuntirish → mini-test → tanga. Duel rejimi bilan!",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

const SW_REGISTER = `if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); }); }`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
      </body>
    </html>
  );
}
