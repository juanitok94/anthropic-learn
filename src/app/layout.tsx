import type { Metadata } from 'next';
import { Syne, JetBrains_Mono, Inter } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700', '800'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['400', '600'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['300', '400', '500'] });

export const metadata: Metadata = {
  title: 'anthropic-learn',
  description: 'Self-updating AI learning platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${jetbrains.variable} ${inter.variable} bg-[#07080f] text-[#d8dcea] min-h-screen font-['Inter',sans-serif]`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
