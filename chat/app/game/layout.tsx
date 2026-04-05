import { Metadata } from 'next';
import "@/app/[locale]/globals.css"; // Ensure standard globals are loaded, but we might override body

export const metadata: Metadata = {
  title: 'Left At Albuquerque | Interactive AI Noir',
  description: '2800 miles. $1,200 cash. And an AI narrator trying to kill you.',
  openGraph: {
    title: 'Left At Albuquerque',
    description: '2800 miles. $1,200 cash. And an AI narrator trying to kill you.',
    type: 'website',
    images: [{
      url: '/game_social_card.jpg', // Placeholder for OG image
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
      <body suppressHydrationWarning className="game-layout-root min-h-screen bg-black overflow-hidden flex flex-col">
        {children}
      </body>
    </html>
  );
}
