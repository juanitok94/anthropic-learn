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
          <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-white leading-none">
            Knowledge <span className="text-[#d97c4a]">Base</span>
          </h1>
          <p className="text-[#4a5070] text-sm mt-2">{entries.length} docs harvested</p>
        </div>
        {entries.length > 0 && (
          <button onClick={exportMarkdown} className="px-4 py-2 rounded-lg border border-[#1a1e30] bg-[#0d0f1c] text-[#5a6080] text-xs font-semibold hover:border-[#d97c4a] hover:text-[#d97c4a] transition-all self-start">
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
          className="w-full px-3 py-2 rounded-lg border border-[#1a1e30] bg-[#0d0f1c] text-[#c0c8e0] text-sm placeholder-[#2a3050] outline-none focus:border-[#d97c4a40]"
        />
      )}

      {!loaded || entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="text-4xl opacity-20">+</div>
          <div className="text-[15px] font-semibold text-[#3a4060] font-['Syne']">No content yet</div>
          <div className="text-xs text-[#2a3050] max-w-xs leading-relaxed">Visit the Curriculum page and harvest topics to build your knowledge base.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-[#3a4060] text-center py-8">No results for &quot;{search}&quot;</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(entry => (
            <div key={entry.sourceId} className="bg-[#0c0e1a] border border-[#13162a] rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-2.5 px-4 py-3.5 cursor-pointer hover:bg-[#0f1120] transition-colors"
                onClick={() => setExpanded(p => ({ ...p, [entry.sourceId]: !p[entry.sourceId] }))}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#50c878] flex-shrink-0" />
                <span className="text-sm font-medium text-[#c0c8e0] flex-1">{entry.label}</span>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#3a4060] bg-[#10121e] px-2 py-0.5 rounded">{entry.level}</span>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#3a4060]">{expanded[entry.sourceId] ? '▲' : '▼'}</span>
              </div>
              {expanded[entry.sourceId] && (
                <div className="border-t border-[#13162a] px-4 pb-4">
                  <div
                    className="prose-content text-sm leading-7 text-[#7080a8] mt-3"
                    dangerouslySetInnerHTML={{ __html: renderMd(entry.content) }}
                  />
                  <div className="mt-3 text-[10px] font-['JetBrains_Mono'] text-[#2a3050]">
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
