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
        <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-white leading-none">
          Anthropic <span className="text-[#d97c4a]">Learn</span>
        </h1>
        <p className="text-[#4a5070] text-sm mt-2">Your self-updating AI curriculum. Study, harvest, and track your progress.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { val: understoodCount, label: 'Topics Understood', max: totalTopics },
          { val: harvestedCount, label: 'Docs Harvested', max: 46 },
          { val: totalTopics - understoodCount, label: 'Topics Remaining', max: totalTopics },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0c0e1a] border border-[#13162a] rounded-xl p-4">
            <div className="font-['JetBrains_Mono'] text-2xl font-semibold text-[#d97c4a]">{stat.val}</div>
            <div className="text-[10px] text-[#3a4060] uppercase tracking-wider mt-1">{stat.label}</div>
            {stat.max && (
              <div className="mt-3 h-0.5 bg-[#13162a] rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#d97c4a] to-[#e8a06a] rounded transition-all" style={{ width: `${Math.min(100, (stat.val / stat.max) * 100)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#3a4060] font-['JetBrains_Mono'] mb-3">Progress by Level</div>
        <div className="flex flex-col gap-3">
          {levelStats.map(s => (
            <div key={s.level} className="bg-[#0c0e1a] border border-[#13162a] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: s.color }}>{s.level}</span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#3a4060]">{s.done}/{s.total}</span>
              </div>
              <div className="h-1 bg-[#13162a] rounded overflow-hidden">
                <div className="h-full rounded transition-all" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#3a4060] font-['JetBrains_Mono'] mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/curriculum" className="bg-[#0c0e1a] border border-[#13162a] hover:border-[#d97c4a30] rounded-xl p-4 transition-all group">
            <div className="text-sm font-semibold text-[#d8dcea] group-hover:text-white">Browse Curriculum</div>
            <div className="text-xs text-[#3a4060] mt-1">14 modules across 3 levels</div>
          </Link>
          <Link href="/analyze" className="bg-[#0c0e1a] border border-[#13162a] hover:border-[#d97c4a30] rounded-xl p-4 transition-all group">
            <div className="text-sm font-semibold text-[#d8dcea] group-hover:text-white">Analyze Transcript</div>
            <div className="text-xs text-[#3a4060] mt-1">12 sections ready to analyze</div>
          </Link>
          <Link href="/knowledge-base" className="bg-[#0c0e1a] border border-[#13162a] hover:border-[#d97c4a30] rounded-xl p-4 transition-all group">
            <div className="text-sm font-semibold text-[#d8dcea] group-hover:text-white">Knowledge Base</div>
            <div className="text-xs text-[#3a4060] mt-1">{harvestedCount} docs harvested</div>
          </Link>
          {recentModules[0] && (
            <Link href={`/curriculum/${recentModules[0].id}`} className="bg-[#0c0e1a] border border-[#13162a] hover:border-[#d97c4a30] rounded-xl p-4 transition-all group">
              <div className="text-sm font-semibold text-[#d8dcea] group-hover:text-white">Continue Studying</div>
              <div className="text-xs text-[#3a4060] mt-1 truncate">{recentModules[0].title}</div>
            </Link>
          )}
        </div>
      </div>

      {/* Recently viewed */}
      {recentModules.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#3a4060] font-['JetBrains_Mono'] mb-3">Recently Viewed</div>
          <div className="flex flex-col gap-2">
            {recentModules.map(mod => (
              <Link key={mod.id} href={`/curriculum/${mod.id}`} className="flex items-center gap-3 bg-[#0c0e1a] border border-[#13162a] hover:border-[#d97c4a30] rounded-xl px-4 py-3 transition-all">
                <span className="text-sm text-[#d8dcea]">{mod.title}</span>
                <span className="text-[10px] font-['JetBrains_Mono'] ml-auto" style={{ color: curriculumData.levelColors[mod.level] }}>{mod.level}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
