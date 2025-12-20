import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { tiemposHeadline } from "./fonts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remrin.ai | Create AI Companions That Remember You",
  description: "Build custom AI companions with memory, personality, and voice. Unlike ChatGPT, Remrin remembers everything. Family-friendly and cross-platform.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Remrin.ai | Create AI Companions That Remember You",
    description: "Build custom AI companions with memory, personality, and voice. Unlike ChatGPT, Remrin remembers everything.",
    url: "https://remrin.ai",
    siteName: "Remrin.ai",
    images: [
      {
        url: "https://gr4y74.github.io/remrin/assets/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remrin.ai | Create AI Companions That Remember You",
    description: "Build custom AI companions with memory, personality, and voice.",
    images: ["https://gr4y74.github.io/remrin/assets/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${tiemposHeadline.variable} ${jetbrainsMono.variable} font-sans text-white antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Base dark background - underneath everything */}
          <div className="base-bg" />

          {/* Stars Layer - visible through transparent content */}
          <div className="stars-wrapper">
            <div id="stars" />
            <div id="stars2" />
            <div id="stars3" />
          </div>

          {/* Vignette Overlay */}
          <div className="vignette" />

          {/* Main Content */}
          <Navbar />
          <main className="relative z-20">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
