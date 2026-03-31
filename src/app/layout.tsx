import type { Metadata } from 'next';
import { Syne, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700', '800'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['400', '600'] });

export const metadata: Metadata = {
  title: 'anthropic-learn',
  description: 'Self-updating AI learning platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${jetbrains.variable} bg-[#F5F5F7] text-[#1D1D1F] min-h-screen`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
