/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  REM COCKPIT — FULLY ISOLATED ROOT LAYOUT                  ║
 * ║                                                            ║
 * ║  /rem has its own <html> and <body> tags.                  ║
 * ║  It does NOT inherit from app/[locale]/layout.tsx.         ║
 * ║                                                            ║
 * ║  ⚠️  DO NOT import globals.css or any platform CSS.         ║
 * ║  ⚠️  DO NOT add platform Providers/RootLayoutContainer.     ║
 * ║  ⚠️  All Rem styles are self-contained via theme-romrin.    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import { Metadata } from 'next';
import "@/app/[locale]/globals.css";

export const metadata: Metadata = {
  title: 'Rem Rin — Solo Cockpit',
  description: 'Professional standalone engine with persistent memory and high-precision extraction.',
};

export default function RemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="theme-romrin dark bg-[#121113] text-white antialiased" style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
