import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  DM_Sans,
  JetBrains_Mono
} from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display"
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "UnLegalize | Legal Clause Simplifier",
  description:
    "Decode Indian rental and leave-and-license clauses into plain English with AI-backed risk insights."
};

export const viewport: Viewport = {
  themeColor: "#080B09"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${cormorantGaramond.variable} ${dmSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
