import React from 'react';
import './sudodo.css';

export const metadata = {
  title: 'PenguinOS — The Everything Linux Platform',
  description: 'AI-powered distro matching, curated tutorials, live community support, and the most comprehensive Linux knowledge base ever built.',
};

export default function SudodoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sudodo-root">
      <div className="grid-bg"></div>
      {children}
    </div>
  );
}
