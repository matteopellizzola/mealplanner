import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meal Planner",
  description: "Planner settimanale con rotazione automatica dei menu.",
  manifest: "/manifest.json",
  icons: [
    {
      rel: "icon",
      url: "/icons/icon-192.png",
    },
    {
      rel: "icon",
      url: "/icons/icon-512.png",
    },
    {
      rel: "apple-touch-icon",
      url: "/icons/icon-192.png",
    },
  ],
  themeColor: "#4a90e2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        {/* apple mobile web app meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meal Planner" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
