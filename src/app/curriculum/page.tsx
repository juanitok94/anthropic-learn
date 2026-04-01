'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import curriculum from '@/data/curriculum.json';
import sourcesRaw from '@/data/sources.json';
import type { CurriculumData, Source, SourcesData, KBEntry } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';

const curriculumData = curriculum as CurriculumData;
const sourcesData = sourcesRaw as SourcesData;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

type SectionStatus = {
  total: number;
  done: number;
  current: string | null;
  errors: number;
};

// Read live from localStorage so parallel closures don't see stale state
function isAlreadyHarvested(sourceId: string): boolean {
  try {
    const stored = localStorage.getItem('anthropic-learn-kb');
    if (!stored) return false;
    const data = JSON.parse(stored) as { entries: Record<string, unknown> };
    return !!data.entries?.[sourceId];
  } catch {
    return false;
  }
}

export default function CurriculumPage() {
  const [activeLevel, setActiveLevel] = useState<string>('Beginner');
  const { progress } = useProgress();
  const { kb, saveEntry } = useKnowledgeBase();
  const [parallelRunning, setParallelRunning] = useState(false);
  const [sectionStatus, setSectionStatus] = useState<Record<string, SectionStatus>>({});

  const levelColors: Record<string, string> = curriculumData.levelColors;

  const levelActiveStyle: Record<string, string> = {
    Beginner: 'bg-[#E8F8EE] text-[#28A745] border-[#28A745]',
    Intermediate: 'bg-[#FEF3EC] text-[#D97C4A] border-[#D97C4A]',
    Advanced: 'bg-[#EEF1FC] text-[#4A6FE8] border-[#4A6FE8]',
  };

  const modules = curriculumData.modules.filter(m => m.level === activeLevel);

  const sections = sourcesData.sections;
  const allTopics = Object.values(sections).flat();
  const totalHarvested = allTopics.filter(t => kb.entries[t.id]).length;

  // ── Sub-agent: harvests one section sequentially ──────────────────────────
  const harvestSection = useCallback(async (
    sectionName: string,
    topics: Source[]
  ) => {
    let done = 0;

    for (const topic of topics) {
      // Check live localStorage — parallel closures would otherwise see stale kb state
      if (isAlreadyHarvested(topic.id)) {
        done++;
        setSectionStatus(prev => ({
          ...prev,
          [sectionName]: { ...prev[sectionName], done, current: topic.label }
        }));
        continue;
      }

      setSectionStatus(prev => ({
        ...prev,
        [sectionName]: { ...prev[sectionName], current: topic.label }
      }));

      try {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'harvest',
            payload: {
              label: topic.label,
              sourceId: topic.id,
              level: 'Intermediate',
              isBiz: !!topic.bizTopic,
              mode: 'kb'
            }
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { content: string };

        const entry: KBEntry = {
          sourceId: topic.id,
          label: topic.label,
          url: topic.url ?? '',
          content: data.content,
          mode: 'kb',
          level: 'Intermediate',
          harvestedAt: new Date().toISOString()
        };
        saveEntry(topic.id, entry);
      } catch {
        setSectionStatus(prev => ({
          ...prev,
          [sectionName]: {
            ...prev[sectionName],
            errors: (prev[sectionName]?.errors ?? 0) + 1
          }
        }));
      }

      done++;
      setSectionStatus(prev => ({
        ...prev,
        [sectionName]: { ...prev[sectionName], done }
      }));
    }

    setSectionStatus(prev => ({
      ...prev,
      [sectionName]: { ...prev[sectionName], current: null }
    }));
  }, [saveEntry]);

  // ── Fan-out: spawn one sub-agent per section simultaneously ───────────────
  const harvestAllParallel = useCallback(async () => {
    setParallelRunning(true);

    const initialStatus: Record<string, SectionStatus> = {};
    for (const [name, topics] of Object.entries(sections)) {
      initialStatus[name] = { total: topics.length, done: 0, current: null, errors: 0 };
    }
    setSectionStatus(initialStatus);

    // Fan out — all sections run concurrently; each harvests its topics in order
    await Promise.all(
      Object.entries(sections).map(([name, topics]) => harvestSection(name, topics))
    );

    setParallelRunning(false);
  }, [sections, harvestSection]);

  const statusEntries = Object.entries(sectionStatus);
  const isComplete = !parallelRunning &&
    statusEntries.length > 0 &&
    statusEntries.every(([, s]) => s.current === null);

  return (
    <main className="max-w-5xl mx-auto px-8 py-10 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-[#1D1D1F] leading-none">
            Anthropic <span className="text-[#D97C4A]">Claude</span><br />Course Builder
          </h1>
          <p className="text-[#6E6E73] text-sm mt-2 max-w-md">
            Self-updating curriculum built from official docs. Select a level, harvest content, study each module.
          </p>
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

      {/* ── Parallel Harvest Panel ── */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-5 border-b border-[#F5F5F7] flex items-center justify-between gap-4">
          <div>
            <div className="font-['Syne'] font-bold text-[14px] text-[#1D1D1F]">
              Knowledge Base — Full Harvest
            </div>
            <div className="text-[12px] text-[#6E6E73] mt-0.5">
              {totalHarvested} / {allTopics.length} topics harvested across {Object.keys(sections).length} sections
            </div>
          </div>
          <button
            onClick={harvestAllParallel}
            disabled={parallelRunning}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D97C4A] text-white
                       hover:bg-[#C46B39] disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all whitespace-nowrap"
          >
            {parallelRunning ? '⚡ Harvesting…' : '⚡ Harvest All (Parallel)'}
          </button>
        </div>

        {/* Per-section progress — visible during and after run */}
        {statusEntries.length > 0 && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {statusEntries.map(([name, status]) => {
              const pct = status.total > 0
                ? Math.round((status.done / status.total) * 100)
                : 0;
              const done = status.current === null;
              return (
                <div key={name} className="bg-[#F5F5F7] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#1D1D1F] truncate pr-2">{name}</span>
                    <span className={`text-[10px] font-mono flex-shrink-0 ${done ? 'text-[#28A745]' : 'text-[#D97C4A]'}`}>
                      {status.done}/{status.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-[#28A745]' : 'bg-[#D97C4A]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {status.current && (
                    <div className="text-[10px] text-[#6E6E73] mt-1.5 truncate">↳ {status.current}</div>
                  )}
                  {status.errors > 0 && (
                    <div className="text-[10px] text-red-500 mt-1">
                      {status.errors} error{status.errors !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isComplete && (
          <div className="px-5 pb-4 text-[12px] text-[#28A745] font-semibold">
            ✓ All sections complete — {totalHarvested} topics in knowledge base
          </div>
        )}
      </div>

      {/* Module grid */}
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
                <div className="font-['Syne'] font-bold text-[15px] text-[#1D1D1F] tracking-tight group-hover:text-[#D97C4A] transition-colors">
                  {mod.title}
                </div>
              </div>
              <div className="px-5 py-3">
                {mod.topics.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      progress.understood[t.id] ? 'bg-[#28A745]' :
                      kb.entries[t.sourceId] ? 'bg-[#D97C4A]' : 'bg-[#D2D2D7]'
                    }`} />
                    <span className={`text-xs ${progress.understood[t.id] ? 'text-[#28A745]' : 'text-[#6E6E73]'} transition-colors`}>
                      {t.label}
                    </span>
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
