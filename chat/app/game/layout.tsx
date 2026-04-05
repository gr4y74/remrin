import { Metadata } from 'next';
import "@/app/[locale]/globals.css"; // Ensure standard globals are loaded, but we might override body

export const metadata: Metadata = {
  title: 'Left At Albuquerque',
  description: 'LOS ANGELES → NEW YORK CITY. By any means necessary.',
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
