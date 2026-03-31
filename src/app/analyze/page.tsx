'use client';
import { useState, useCallback, useRef } from 'react';
import transcriptsData from '@/data/transcripts.json';
import type { TranscriptsData, TranscriptChunk, AnalysisResult } from '@/types';
import { useTranscriptAnalyses } from '@/hooks/useTranscriptAnalyses';

const data = transcriptsData as unknown as TranscriptsData;

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

export default function AnalyzePage() {
  const transcript = data.transcripts[0];
  const { analyses, saveAnalysis } = useTranscriptAnalyses();
  const [processing, setProcessing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [runningAll, setRunningAll] = useState(false);
  const stopRef = useRef(false);

  const analyzeChunk = useCallback(async (chunk: TranscriptChunk) => {
    setProcessing(chunk.id);
    setErrors(p => ({ ...p, [chunk.id]: '' }));
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'analyze',
          payload: { chunkId: chunk.id, title: chunk.title, rawContent: chunk.rawContent },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'API error');
      const result: AnalysisResult = {
        studyNotes: '',
        tips: '',
        curriculumMap: [],
        docRefs: [],
        analyzedAt: new Date().toISOString(),
        raw: json.content,
      };
      saveAnalysis(chunk.id, result);
      setExpanded(p => ({ ...p, [chunk.id]: true }));
    } catch (e: unknown) {
      setErrors(p => ({ ...p, [chunk.id]: e instanceof Error ? e.message : 'Error' }));
    }
    setProcessing(null);
    await new Promise(r => setTimeout(r, 400));
  }, [saveAnalysis]);

  const analyzeAll = async () => {
    setRunningAll(true);
    stopRef.current = false;
    for (const chunk of transcript.chunks) {
      if (stopRef.current) break;
      if (!analyses[chunk.id]) {
        await analyzeChunk(chunk);
      }
    }
    setRunningAll(false);
  };

  const analyzedCount = Object.keys(analyses).length;
  const totalChunks = transcript.chunks.length;

  return (
    <main className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-6">
      <div>
        <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-[#1D1D1F] leading-none">
          Transcript <span className="text-[#D97C4A]">Analyzer</span>
        </h1>
        <p className="text-[#6E6E73] text-sm mt-2">{transcript.title}</p>
      </div>

      {/* Progress card */}
      <div className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[#6E6E73]">{analyzedCount} / {totalChunks} sections analyzed</div>
          <div className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            processing
              ? 'bg-[#E8F8EE] text-[#28A745]'
              : analyzedCount === totalChunks
              ? 'bg-[#E8F8EE] text-[#28A745]'
              : 'bg-[#F5F5F7] text-[#6E6E73]'
          }`}>
            {processing ? 'RUNNING' : analyzedCount === totalChunks ? 'DONE' : 'IDLE'}
          </div>
        </div>
        <div className="h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden mb-5">
          <div className="h-full bg-gradient-to-r from-[#D97C4A] to-[#E8A06A] rounded-full transition-all" style={{ width: `${totalChunks ? (analyzedCount / totalChunks) * 100 : 0}%` }} />
        </div>
        <button
          onClick={runningAll ? () => { stopRef.current = true; setRunningAll(false); } : analyzeAll}
          disabled={!runningAll && analyzedCount === totalChunks}
          className={`w-full py-3 rounded-xl font-['Syne'] font-bold text-sm text-white transition-opacity disabled:opacity-35 disabled:cursor-not-allowed ${
            runningAll ? 'bg-[#D94040]' : 'bg-[#D97C4A]'
          } hover:opacity-90`}
        >
          {runningAll ? 'Stop' : 'Analyze All Sections'}
        </button>
      </div>

      {/* Chunks */}
      <div className="flex flex-col gap-3">
        {transcript.chunks.map(chunk => {
          const analysis = analyses[chunk.id];
          const isProcessing = processing === chunk.id;
          const isExpanded = expanded[chunk.id];
          const err = errors[chunk.id];

          return (
            <div key={chunk.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#F5F5F7] transition-colors"
                onClick={() => analysis && setExpanded(p => ({ ...p, [chunk.id]: !p[chunk.id] }))}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  analysis ? 'bg-[#28A745]' : isProcessing ? 'bg-[#D97C4A] animate-pulse' : 'bg-[#D2D2D7]'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1D1D1F]">{chunk.title}</div>
                  <div className="text-[11px] text-[#6E6E73] mt-0.5">{chunk.timestamp}</div>
                </div>
                {analysis && (
                  <span className="text-[11px] font-semibold text-[#28A745] bg-[#E8F8EE] px-2.5 py-0.5 rounded-full">
                    Analyzed
                  </span>
                )}
                {isProcessing && (
                  <span className="text-[11px] font-semibold text-[#D97C4A] animate-pulse">
                    Analyzing...
                  </span>
                )}
              </div>

              {isExpanded && analysis && (
                <div className="border-t border-[#F5F5F7] px-5 pb-5">
                  <div
                    className="prose-content text-sm leading-7 mt-4"
                    dangerouslySetInnerHTML={{ __html: renderMd(analysis.raw) }}
                  />
                </div>
              )}

              {!analysis && !isProcessing && (
                <div className="border-t border-[#F5F5F7] px-5 py-3">
                  {err && (
                    <div className="text-xs text-[#D94040] bg-[#FEF0F0] border border-[#F5C5C5] rounded-xl px-3 py-2 mb-2">
                      {err}
                    </div>
                  )}
                  <button
                    onClick={() => analyzeChunk(chunk)}
                    disabled={!!processing}
                    className="w-full py-2 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold hover:border-[#D97C4A] hover:text-[#D97C4A] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Analyze Section
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
