'use client';
import { useState } from 'react';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';

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

export default function KnowledgeBasePage() {
  const { kb, loaded, exportMarkdown } = useKnowledgeBase();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const entries = Object.values(kb.entries);
  const filtered = search
    ? entries.filter(e => e.label.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <main className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-[#1D1D1F] leading-none">
            Knowledge <span className="text-[#D97C4A]">Base</span>
          </h1>
          <p className="text-[#6E6E73] text-sm mt-2">{entries.length} docs harvested</p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={exportMarkdown}
            className="px-4 py-2 rounded-xl border border-[#D2D2D7] bg-white text-[#1D1D1F] text-xs font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#D97C4A] hover:text-[#D97C4A] transition-all self-start"
          >
            Export All MD
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-[#1D1D1F] text-sm placeholder-[#6E6E73] outline-none focus:border-[#D97C4A] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
        />
      )}

      {!loaded || entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="text-5xl">📚</div>
          <div className="text-[15px] font-semibold text-[#1D1D1F] font-['Syne'] mt-2">No content yet</div>
          <div className="text-sm text-[#6E6E73] max-w-xs leading-relaxed">Visit the Curriculum page and harvest topics to build your knowledge base.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-[#6E6E73] text-center py-8">No results for &quot;{search}&quot;</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(entry => (
            <div key={entry.sourceId} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                onClick={() => setExpanded(p => ({ ...p, [entry.sourceId]: !p[entry.sourceId] }))}
              >
                <div className="w-2 h-2 rounded-full bg-[#28A745] flex-shrink-0" />
                <span className="text-sm font-medium text-[#1D1D1F] flex-1">{entry.label}</span>
                <span className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-md">{entry.level}</span>
                <span className="text-[#6E6E73] text-xs">{expanded[entry.sourceId] ? '▲' : '▼'}</span>
              </div>
              {expanded[entry.sourceId] && (
                <div className="border-t border-[#F5F5F7] px-5 pb-5">
                  <div
                    className="prose-content text-sm leading-7 mt-4"
                    dangerouslySetInnerHTML={{ __html: renderMd(entry.content) }}
                  />
                  <div className="mt-4 text-[11px] text-[#6E6E73]">
                    Harvested: {new Date(entry.harvestedAt).toLocaleDateString()} · Mode: {entry.mode}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
