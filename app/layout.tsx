import type { Metadata } from 'next';
import { Inter, DM_Serif_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'OneSpirit | Somatic Narrative Engine',
  description: 'Duolingo for the Soul - A 19-day somatic narrative engine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
       <body className="bg-[#1a1a2e] text-[#f8f9fa] min-h-screen selection:bg-violet-500/30 font-sans leading-[1.6]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
