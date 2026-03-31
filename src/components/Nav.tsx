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
    <nav className="sticky top-0 z-50 flex items-center px-8 h-[60px] border-b border-[#131620] bg-[#07080f]">
      <span className="font-['Syne'] font-extrabold text-base tracking-tight text-white mr-1">
        anthropic<span className="text-[#d97c4a]">-learn</span>
      </span>
      <div className="flex gap-0.5 ml-8">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))
                ? 'bg-[#13162a] text-[#d8dcea]'
                : 'text-[#4a5070] hover:text-[#9aa0c0]'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
