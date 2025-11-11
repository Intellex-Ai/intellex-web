import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Intellex Research Assistant',
  description: 'Multi-agent research reports with citations and Supabase-powered auth.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950 text-slate-100">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-base antialiased">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
