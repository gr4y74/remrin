/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  SUDODO LAYOUT — FULLY ISOLATED ROOT LAYOUT         ║
 * ║                                                    ║
 * ║  /sudodo has its own <html> and <body> tags.       ║
 * ║  It does NOT inherit from app/[locale]/layout.tsx. ║
 * ║                                                    ║
 * ║  ⚠️  DO NOT import globals.css unless needed for   ║
 * ║      Tailwind utility classes.                     ║
 * ║  ⚠️  All styles are self-contained in sudodo.css.   ║
 * ╚══════════════════════════════════════════════════════╝
 */
import React from 'react';
import './sudodo.css';
import "@/app/[locale]/globals.css"; 

export const metadata = {
  title: 'PenguinOS — The Everything Linux Platform',
  description: 'AI-powered distro matching, curated tutorials, live community support, and the most comprehensive Linux knowledge base ever built.',
};

export default function SudodoRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ margin: 0, padding: 0 }}>
        <div className="sudodo-root">
          <div className="grid-bg"></div>
          {children}
        </div>
      </body>
    </html>
  );
}
