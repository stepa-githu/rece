import type { Metadata } from "next";
import { appUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Rece — Recensioni intelligenti",
    template: "%s · Rece",
  },
  description:
    "Raccogli le recensioni della tua struttura e prepara risposte coerenti con la tua identità.",
  applicationName: "Rece",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Rece — Recensioni intelligenti",
    description: "Tutte le recensioni della struttura, una risposta davvero tua.",
    type: "website",
    locale: "it_IT",
    url: appUrl,
    siteName: "Rece",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Rece — Recensioni intelligenti per l’hospitality" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rece — Recensioni intelligenti",
    description: "Tutte le recensioni della struttura, una risposta davvero tua.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
