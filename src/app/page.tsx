'use client';
import Link from 'next/link';
import { useCallback } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useTranscriptAnalyses } from '@/hooks/useTranscriptAnalyses';
import curriculum from '@/data/curriculum.json';
import type { CurriculumData, Module } from '@/types';

const curriculumData = curriculum as CurriculumData;

export default function Dashboard() {
  const { progress, loaded } = useProgress();
  const { kb } = useKnowledgeBase();
  const { analyses } = useTranscriptAnalyses();

  const exportSeedFile = useCallback((type: 'kb' | 'analyses') => {
    const json = type === 'kb'
      ? JSON.stringify({ entries: kb.entries }, null, 2)
      : JSON.stringify({ analyses }, null, 2);
    const filename = type === 'kb' ? 'knowledge-base-seed.json' : 'transcripts-seed.json';
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }, [kb.entries, analyses]);

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
      {/* Seed Data Export */}
      <div className="border border-dashed border-[#D2D2D7] rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1">Seed Data Export</div>
            <p className="text-xs text-[#6E6E73] max-w-sm leading-relaxed">
              Export current state as seed files. Commit to <code className="bg-[#F5F5F7] px-1 py-0.5 rounded text-[#1D1D1F] border border-[#D2D2D7]">src/data/</code> to pre-populate the app for all new visitors.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => exportSeedFile('kb')}
            disabled={harvestedCount === 0}
            className="flex flex-col gap-1 p-4 rounded-xl border border-[#D2D2D7] bg-white text-left hover:border-[#D97C4A] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#D97C4A] transition-colors">knowledge-base-seed.json</div>
            <div className="text-[11px] text-[#6E6E73]">{harvestedCount} harvested {harvestedCount === 1 ? 'entry' : 'entries'}</div>
          </button>
          <button
            onClick={() => exportSeedFile('analyses')}
            disabled={Object.keys(analyses).length === 0}
            className="flex flex-col gap-1 p-4 rounded-xl border border-[#D2D2D7] bg-white text-left hover:border-[#D97C4A] transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="text-xs font-semibold text-[#1D1D1F] group-hover:text-[#D97C4A] transition-colors">transcripts-seed.json</div>
            <div className="text-[11px] text-[#6E6E73]">{Object.keys(analyses).length} analyzed {Object.keys(analyses).length === 1 ? 'section' : 'sections'}</div>
          </button>
        </div>
        <p className="text-[11px] text-[#6E6E73] mt-3 leading-relaxed">
          After downloading, replace <code className="bg-[#F5F5F7] px-1 py-0.5 rounded text-[#1D1D1F] border border-[#D2D2D7]">src/data/knowledge-base-seed.json</code> and <code className="bg-[#F5F5F7] px-1 py-0.5 rounded text-[#1D1D1F] border border-[#D2D2D7]">src/data/transcripts-seed.json</code>, then commit and push. New visitors will load your pre-seeded content.
        </p>
      </div>
    </main>
  );
}
