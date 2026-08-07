import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ruang Temu", template: "%s — Ruang Temu" },
  description: "Undangan pernikahan digital yang personal dan elegan.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "The Wedding of Aruna & Bima", description: "Dengan penuh sukacita, kami mengundang Anda untuk hadir di hari istimewa kami.", type: "website", locale: "id_ID" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
