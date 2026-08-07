import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "The Wedding — Undangan Pernikahan", template: "%s — Undangan Pernikahan" },
  description: "Dengan penuh sukacita, kami mengundang Anda untuk hadir di hari istimewa kami.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "The Wedding — Undangan Pernikahan",
    description: "Dengan penuh sukacita, kami mengundang Anda untuk hadir di hari istimewa kami.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Wedding — Undangan Pernikahan",
    description: "Dengan penuh sukacita, kami mengundang Anda untuk hadir di hari istimewa kami.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
