'use client';
import Link from 'next/link';
import { useProgress } from '@/hooks/useProgress';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import curriculum from '@/data/curriculum.json';
import type { CurriculumData, Module } from '@/types';

const curriculumData = curriculum as CurriculumData;

export default function Dashboard() {
  const { progress, loaded } = useProgress();
  const { kb } = useKnowledgeBase();

  const allTopics = curriculumData.modules.flatMap(m => m.topics);
  const understoodCount = Object.values(progress.understood).filter(Boolean).length;
  const harvestedCount = Object.keys(kb.entries).length;
  const totalTopics = allTopics.length;

  const recentModules = progress.recentlyViewed
    .map(id => curriculumData.modules.find(m => m.id === id))
    .filter((m): m is Module => Boolean(m))
    .slice(0, 3);

  const levelStats = (['Beginner', 'Intermediate', 'Advanced'] as const).map(level => {
    const mods = curriculumData.modules.filter(m => m.level === level);
    const topics = mods.flatMap(m => m.topics);
    const done = topics.filter(t => progress.understood[t.id]).length;
    return { level, total: topics.length, done, color: curriculumData.levelColors[level] };
  });

  if (!loaded) return null;

  return (
    <main className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
      <div>
        <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-[#1D1D1F] leading-none">
          Anthropic <span className="text-[#D97C4A]">Learn</span>
        </h1>
        <p className="text-[#6E6E73] text-sm mt-2">Your self-updating AI curriculum. Study, harvest, and track your progress.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { val: understoodCount, label: 'Topics Understood', max: totalTopics },
          { val: harvestedCount, label: 'Docs Harvested', max: 46 },
          { val: totalTopics - understoodCount, label: 'Topics Remaining', max: totalTopics },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <div className="font-['Syne'] text-3xl font-bold text-[#D97C4A]">{stat.val}</div>
            <div className="text-[11px] text-[#6E6E73] uppercase tracking-wider mt-1 font-medium">{stat.label}</div>
            {stat.max && (
              <div className="mt-3 h-1 bg-[#E8E8ED] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D97C4A] to-[#E8A06A] rounded-full transition-all" style={{ width: `${Math.min(100, (stat.val / stat.max) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">Progress by Level</div>
        <div className="flex flex-col gap-3">
          {levelStats.map(s => (
            <div key={s.level} className="bg-white rounded-2xl px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: s.color }}>{s.level}</span>
                <span className="text-xs text-[#6E6E73]">{s.done}/{s.total}</span>
              </div>
              <div className="h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/curriculum" className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all group">
            <div className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#D97C4A] transition-colors">Browse Curriculum</div>
            <div className="text-xs text-[#6E6E73] mt-1">14 modules across 3 levels</div>
          </Link>
          <Link href="/analyze" className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all group">
            <div className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#D97C4A] transition-colors">Analyze Transcript</div>
            <div className="text-xs text-[#6E6E73] mt-1">12 sections ready to analyze</div>
          </Link>
          <Link href="/knowledge-base" className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all group">
            <div className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#D97C4A] transition-colors">Knowledge Base</div>
            <div className="text-xs text-[#6E6E73] mt-1">{harvestedCount} docs harvested</div>
          </Link>
          {recentModules[0] && (
            <Link href={`/curriculum/${recentModules[0].id}`} className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all group">
              <div className="text-sm font-semibold text-[#1D1D1F] group-hover:text-[#D97C4A] transition-colors">Continue Studying</div>
              <div className="text-xs text-[#6E6E73] mt-1 truncate">{recentModules[0].title}</div>
            </Link>
          )}
        </div>
      </div>

      {/* Recently viewed */}
      {recentModules.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-3">Recently Viewed</div>
          <div className="flex flex-col gap-2">
            {recentModules.map(mod => (
              <Link key={mod.id} href={`/curriculum/${mod.id}`} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all">
                <span className="text-sm text-[#1D1D1F]">{mod.title}</span>
                <span className="text-[11px] font-medium ml-auto" style={{ color: curriculumData.levelColors[mod.level] }}>{mod.level}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
