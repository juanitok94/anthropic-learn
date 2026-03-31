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

  const levelActiveStyle: Record<string, string> = {
    Beginner: 'bg-[#E8F8EE] text-[#28A745] border-[#28A745]',
    Intermediate: 'bg-[#FEF3EC] text-[#D97C4A] border-[#D97C4A]',
    Advanced: 'bg-[#EEF1FC] text-[#4A6FE8] border-[#4A6FE8]',
  };

  const modules = curriculumData.modules.filter(m => m.level === activeLevel);

  return (
    <main className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-[#1D1D1F] leading-none">
            Anthropic <span className="text-[#D97C4A]">Claude</span><br />Course Builder
          </h1>
          <p className="text-[#6E6E73] text-sm mt-2 max-w-md">Self-updating curriculum built from official docs. Select a level, harvest content, study each module.</p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-2">Skill Level</div>
          <div className="flex gap-1.5">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setActiveLevel(l)}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeLevel === l
                    ? levelActiveStyle[l]
                    : 'border-[#D2D2D7] bg-white text-[#6E6E73] hover:text-[#1D1D1F] hover:border-[#D97C4A]'
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
              className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-all group"
            >
              <div className="p-5 pb-4 border-b border-[#F5F5F7]">
                <div className="text-[10px] font-semibold mb-1.5" style={{ color: levelColors[activeLevel] }}>
                  {String(mi + 1).padStart(2, '0')} / {modules.length}
                </div>
                {isBiz && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D97C4A] bg-[#FEF3EC] border border-[#F5C9A8] rounded-md px-2 py-0.5 mb-2">
                    $ BIZ
                  </div>
                )}
                <div className="font-['Syne'] font-bold text-[15px] text-[#1D1D1F] tracking-tight group-hover:text-[#D97C4A] transition-colors">{mod.title}</div>
              </div>
              <div className="px-5 py-3">
                {mod.topics.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${progress.understood[t.id] ? 'bg-[#28A745]' : kb.entries[t.sourceId] ? 'bg-[#D97C4A]' : 'bg-[#D2D2D7]'}`} />
                    <span className={`text-xs ${progress.understood[t.id] ? 'text-[#28A745]' : 'text-[#6E6E73]'} transition-colors`}>{t.label}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-[#F5F5F7] flex items-center justify-between">
                <span className="text-[11px] text-[#6E6E73]">{topicsDone}/{mod.topics.length} understood</span>
                <span className="text-[11px] text-[#6E6E73]">{harvested} harvested</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
