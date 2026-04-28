/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  GAME LAYOUT — FULLY ISOLATED ROOT LAYOUT          ║
 * ║                                                    ║
 * ║  /game has its own <html> and <body> tags.         ║
 * ║  It does NOT inherit from app/[locale]/layout.tsx. ║
 * ║                                                    ║
 * ║  ⚠️  DO NOT import globals.css or any platform CSS. ║
 * ║  ⚠️  DO NOT add Providers/RootLayoutContainer.      ║
 * ║  ⚠️  All game styles must be self-contained.        ║
 * ╚══════════════════════════════════════════════════════╝
 */
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Left At Albuquerque | Interactive AI Noir',
  description: '2800 miles. $1,200 cash. And an AI narrator trying to kill you.',
  openGraph: {
    title: 'Left At Albuquerque',
    description: '2800 miles. $1,200 cash. And an AI narrator trying to kill you.',
    type: 'website',
    images: [{
      url: '/game_social_card.jpg',
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Left At Albuquerque',
    description: '2800 miles. $1,200 cash. And an AI narrator trying to kill you.',
  }
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="game-layout-root min-h-screen bg-black overflow-hidden flex flex-col" style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
