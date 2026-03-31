'use client';
import { useState, useCallback, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import curriculum from '@/data/curriculum.json';
import sources from '@/data/sources.json';
import type { CurriculumData, SourcesData, KBEntry } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import InfoTooltip from '@/components/InfoTooltip';

const curriculumData = curriculum as CurriculumData;
const sourcesData = sources as SourcesData;

const sourceMap: Record<string, { label: string; url: string; bizTopic?: boolean }> = {};
Object.values(sourcesData.sections).forEach(items => {
  items.forEach(item => { sourceMap[item.id] = item; });
});

function renderMd(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>(\n|$))+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup/<])(.+)$/gm, m => m.trim() ? `<p>${m}</p>` : '');
}

export default function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const mod = curriculumData.modules.find(m => m.id === moduleId);
  if (!mod) notFound();

  const { progress, markUnderstood, addRecentlyViewed } = useProgress();
  const { kb, saveEntry } = useKnowledgeBase();
  const [harvesting, setHarvesting] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'lesson' | 'kb'>('lesson');

  useEffect(() => {
    addRecentlyViewed(mod.id);
  }, [mod.id, addRecentlyViewed]);

  const harvestTopic = useCallback(async (topicId: string, sourceId: string) => {
    const source = sourceMap[sourceId];
    if (!source) return;
    setHarvesting(p => ({ ...p, [topicId]: true }));
    setErrors(p => ({ ...p, [topicId]: '' }));
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'harvest',
          payload: {
            label: source.label,
            sourceId,
            level: mod.level,
            isBiz: source.bizTopic ?? false,
            mode,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      const entry: KBEntry = {
        sourceId,
        label: source.label,
        url: source.url,
        content: data.content,
        mode,
        level: mod.level,
        harvestedAt: new Date().toISOString(),
      };
      saveEntry(sourceId, entry);
      setExpanded(p => ({ ...p, [topicId]: true }));
    } catch (e: unknown) {
      setErrors(p => ({ ...p, [topicId]: e instanceof Error ? e.message : 'Error' }));
    }
    setHarvesting(p => ({ ...p, [topicId]: false }));
    await new Promise(r => setTimeout(r, 400));
  }, [mod, mode, saveEntry]);

  const harvestAll = async () => {
    for (const topic of mod.topics) {
      if (!kb.entries[topic.sourceId]) {
        await harvestTopic(topic.id, topic.sourceId);
      }
    }
  };

  const exportModuleMd = () => {
    const lines = [`# ${mod.title} — ${mod.level}`, `_Exported: ${new Date().toLocaleString()}_`, '', '---', ''];
    mod.topics.forEach(t => {
      const entry = kb.entries[t.sourceId];
      lines.push(`# ${t.label}`);
      if (entry) lines.push(entry.content);
      else lines.push('_Not yet harvested_');
      lines.push('', '---', '');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${mod.id}-${Date.now()}.md`;
    a.click();
  };

  const levelColor = curriculumData.levelColors[mod.level];
  const isAnyHarvesting = Object.values(harvesting).some(Boolean);

  return (
    <main className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/curriculum"
          className="px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white text-[#6E6E73] text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:text-[#1D1D1F] hover:border-[#D97C4A] transition-all"
        >
          ← Curriculum
        </Link>
        <span className="text-xs text-[#6E6E73]">
          / <span style={{ color: levelColor }}>{mod.level}</span> / {mod.title}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="font-['Syne'] font-extrabold text-2xl text-[#1D1D1F] tracking-tight">{mod.title}</h1>
        <div className="text-xs text-[#6E6E73] mt-1">{mod.topics.length} topics · {mod.topics.reduce((a, t) => a + t.readingMinutes, 0)} min total</div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 p-1 bg-[#F5F5F7] rounded-xl">
          {(['lesson', 'kb'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.1)]'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              {m === 'lesson' ? 'Lessons' : 'Knowledge Base'}
            </button>
          ))}
        </div>

        <span className="flex items-center gap-1.5">
          <button
            onClick={harvestAll}
            disabled={isAnyHarvesting}
            className="px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white text-[#1D1D1F] text-xs font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#D97C4A] hover:text-[#D97C4A] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Harvest All
          </button>
          <InfoTooltip text="Generates lessons for all topics in this module sequentially. Takes 2–3 minutes total." />
        </span>

        <button
          onClick={exportModuleMd}
          className="px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-white text-[#6E6E73] text-xs font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#D97C4A] hover:text-[#D97C4A] transition-all ml-auto"
        >
          Export MD
        </button>
      </div>

      {/* Topics */}
      <div className="flex flex-col gap-3">
        {mod.topics.map(topic => {
          const entry = kb.entries[topic.sourceId];
          const isHarvesting = harvesting[topic.id];
          const isExpanded = expanded[topic.id];
          const isUnderstood = progress.understood[topic.id];
          const err = errors[topic.id];

          return (
            <div key={topic.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                onClick={() => entry && setExpanded(p => ({ ...p, [topic.id]: !p[topic.id] }))}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isUnderstood ? 'bg-[#28A745]' : entry ? 'bg-[#D97C4A]' : 'bg-[#D2D2D7]'
                }`} />
                <span className="text-sm font-medium text-[#1D1D1F] flex-1">{topic.label}</span>
                <span className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-md">{topic.readingMinutes}m</span>
                {entry && (
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    isUnderstood
                      ? 'bg-[#E8F8EE] text-[#28A745]'
                      : 'bg-[#FEF3EC] text-[#D97C4A]'
                  }`}>
                    {isUnderstood ? 'Understood' : 'Harvested'}
                  </span>
                )}
                {isHarvesting && (
                  <span className="text-[11px] font-semibold text-[#D97C4A] animate-pulse">Processing...</span>
                )}
              </div>

              {isExpanded && entry && (
                <div className="border-t border-[#F5F5F7] px-5 pb-5">
                  <div
                    className="prose-content text-sm leading-7 mt-4"
                    dangerouslySetInnerHTML={{ __html: renderMd(entry.content) }}
                  />
                  <div className="flex gap-2 mt-5 items-center">
                    <button
                      onClick={() => harvestTopic(topic.id, topic.sourceId)}
                      disabled={isHarvesting}
                      className="px-3 py-1.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7] text-[#6E6E73] text-xs font-semibold hover:border-[#D97C4A] hover:text-[#D97C4A] disabled:opacity-30 transition-all"
                    >
                      Re-harvest
                    </button>
                    <InfoTooltip
                      text="Calls Anthropic API to generate a structured lesson from official docs. Saves automatically — no re-generating needed."
                      position="top"
                    />
                    <button
                      onClick={() => markUnderstood(topic.id, !isUnderstood)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ml-1 ${
                        isUnderstood
                          ? 'border-[#28A745] text-[#28A745] bg-[#E8F8EE]'
                          : 'border-[#D2D2D7] bg-[#F5F5F7] text-[#6E6E73] hover:border-[#28A745] hover:text-[#28A745]'
                      }`}
                    >
                      {isUnderstood ? '✓ Understood' : 'Mark Understood'}
                    </button>
                  </div>
                </div>
              )}

              {!entry && !isHarvesting && (
                <div className="border-t border-[#F5F5F7] px-5 py-3">
                  {err && (
                    <div className="text-xs text-[#D94040] bg-[#FEF0F0] border border-[#F5C5C5] rounded-xl px-3 py-2 mb-2">
                      {err}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => harvestTopic(topic.id, topic.sourceId)}
                      disabled={isHarvesting}
                      className="flex-1 py-2 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold hover:border-[#D97C4A] hover:text-[#D97C4A] disabled:opacity-30 transition-all"
                    >
                      Harvest Topic
                    </button>
                    <InfoTooltip
                      text="Calls Anthropic API to generate a structured lesson from official docs. Saves automatically — no re-generating needed."
                      position="top"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
