'use client';
import { useState } from 'react';
import Link from 'next/link';
import curriculum from '@/data/curriculum.json';
import type { CurriculumData } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';

const curriculumData = curriculum as CurriculumData;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function CurriculumPage() {
  const [activeLevel, setActiveLevel] = useState<string>('Beginner');
  const { progress } = useProgress();
  const { kb } = useKnowledgeBase();

  const levelColors: Record<string, string> = curriculumData.levelColors;
  const levelActiveBg: Record<string, string> = {
    Beginner: 'border-[#50c878] text-[#50c878] bg-[#0a1a0c]',
    Intermediate: 'border-[#d97c4a] text-[#d97c4a] bg-[#1a1008]',
    Advanced: 'border-[#7090e8] text-[#7090e8] bg-[#0a0c1e]',
  };

  const modules = curriculumData.modules.filter(m => m.level === activeLevel);

  return (
    <main className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-white leading-none">
            Anthropic <span className="text-[#d97c4a]">Claude</span><br />Course Builder
          </h1>
          <p className="text-[#4a5070] text-sm mt-2 max-w-md">Self-updating curriculum built from official docs. Select a level, harvest content, study each module.</p>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#3a4060] font-['JetBrains_Mono'] mb-2">Skill Level</div>
          <div className="flex gap-1">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setActiveLevel(l)}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  activeLevel === l ? levelActiveBg[l] : 'border-[#1a1e30] bg-[#0d0f1c] text-[#4a5070] hover:text-[#8090b0] hover:border-[#d97c4a50]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod, mi) => {
          const topicsDone = mod.topics.filter(t => progress.understood[t.id]).length;
          const harvested = mod.topics.filter(t => kb.entries[t.sourceId]).length;
          const isBiz = mod.type === 'business';
          return (
            <Link
              key={mod.id}
              href={`/curriculum/${mod.id}`}
              className={`bg-[#0c0e1a] border rounded-xl overflow-hidden hover:border-[#d97c4a30] transition-all group ${isBiz ? 'border-[#2a1a0a] bg-[#0e0c0a]' : 'border-[#13162a]'}`}
            >
              <div className={`p-4 pb-3 border-b ${isBiz ? 'border-[#2a1a0a]' : 'border-[#13162a]'}`}>
                <div className="font-['JetBrains_Mono'] text-[10px] font-semibold mb-1" style={{ color: levelColors[activeLevel] }}>
                  {String(mi + 1).padStart(2, '0')} / {modules.length}
                </div>
                {isBiz && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] font-bold text-[#d97c4a] bg-[#1a1005] border border-[#3a2010] rounded px-2 py-0.5 mb-1.5">
                    $ BIZ
                  </div>
                )}
                <div className="font-['Syne'] font-bold text-[15px] text-[#d8dcea] tracking-tight">{mod.title}</div>
              </div>
              <div className="p-3 pb-4">
                {mod.topics.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5">
                    <div className={`w-1 h-1 rounded-full flex-shrink-0 ${progress.understood[t.id] ? 'bg-[#50c878]' : kb.entries[t.sourceId] ? 'bg-[#d97c4a]' : 'bg-[#2a3050]'}`} />
                    <span className={`text-xs ${progress.understood[t.id] ? 'text-[#50c878]' : 'text-[#5a6080] group-hover:text-[#a0a8c8]'} transition-colors`}>{t.label}</span>
                  </div>
                ))}
              </div>
              <div className={`px-4 py-3 border-t ${isBiz ? 'border-[#2a1a0a]' : 'border-[#13162a]'} flex items-center justify-between`}>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#3a4060]">{topicsDone}/{mod.topics.length} understood</span>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#3a4060]">{harvested} harvested</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
