'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/curriculum', label: 'Curriculum' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/analyze', label: 'Analyze' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 flex items-center px-8 h-[60px] border-b border-[#D2D2D7] bg-white">
      <span className="font-['Syne'] font-extrabold text-base tracking-tight text-[#1D1D1F] mr-1">
        anthropic<span className="text-[#D97C4A]">-learn</span>
      </span>
      <div className="flex gap-0.5 ml-8">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))
                ? 'bg-[#F5F5F7] text-[#1D1D1F] font-semibold'
                : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
