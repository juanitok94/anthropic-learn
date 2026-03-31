'use client';
import { useState, useCallback, useRef } from 'react';
import transcriptsData from '@/data/transcripts.json';
import type { TranscriptsData, TranscriptChunk } from '@/types';

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

type AnalysisResult = {
  studyNotes: string;
  tips: string;
  curriculumMap: string[];
  docRefs: string[];
  analyzedAt: string;
  raw: string;
};

export default function AnalyzePage() {
  const transcript = data.transcripts[0];
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
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
      setAnalyses(p => ({ ...p, [chunk.id]: result }));
      setExpanded(p => ({ ...p, [chunk.id]: true }));
    } catch (e: unknown) {
      setErrors(p => ({ ...p, [chunk.id]: e instanceof Error ? e.message : 'Error' }));
    }
    setProcessing(null);
    await new Promise(r => setTimeout(r, 400));
  }, []);

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
        <h1 className="font-['Syne'] font-extrabold text-[28px] tracking-tight text-white leading-none">
          Transcript <span className="text-[#d97c4a]">Analyzer</span>
        </h1>
        <p className="text-[#4a5070] text-sm mt-2">{transcript.title}</p>
      </div>

      {/* Progress bar */}
      <div className="bg-[#0c0e1a] border border-[#13162a] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-['JetBrains_Mono'] text-[#3a4060]">{analyzedCount} / {totalChunks} sections analyzed</div>
          <div className={`text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded font-semibold ${processing ? 'bg-[#101a08] border border-[#2a4a10] text-[#70cc30] animate-pulse' : analyzedCount === totalChunks ? 'bg-[#0c1a10] border border-[#1a3820] text-[#50c878]' : 'bg-[#10121c] border border-[#1e2238] text-[#3a4060]'}`}>
            {processing ? 'RUNNING' : analyzedCount === totalChunks ? 'DONE' : 'IDLE'}
          </div>
        </div>
        <div className="h-1 bg-[#13162a] rounded overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-[#d97c4a] to-[#e8a06a] rounded transition-all" style={{ width: `${totalChunks ? (analyzedCount / totalChunks) * 100 : 0}%` }} />
        </div>
        <button
          onClick={runningAll ? () => { stopRef.current = true; setRunningAll(false); } : analyzeAll}
          disabled={!runningAll && analyzedCount === totalChunks}
          className={`w-full py-3 rounded-lg font-['Syne'] font-bold text-sm text-white transition-opacity disabled:opacity-35 disabled:cursor-not-allowed ${runningAll ? 'bg-gradient-to-r from-[#c04040] to-[#903030]' : 'bg-gradient-to-r from-[#d97c4a] to-[#c06030]'} hover:opacity-90`}
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
            <div key={chunk.id} className="bg-[#0c0e1a] border border-[#13162a] rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-2.5 px-4 py-3.5 cursor-pointer hover:bg-[#0f1120] transition-colors"
                onClick={() => analysis && setExpanded(p => ({ ...p, [chunk.id]: !p[chunk.id] }))}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${analysis ? 'bg-[#50c878]' : isProcessing ? 'bg-[#70cc30] animate-pulse' : 'bg-[#2a3050]'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#c0c8e0]">{chunk.title}</div>
                  <div className="text-[10px] font-['JetBrains_Mono'] text-[#3a4060] mt-0.5">{chunk.timestamp}</div>
                </div>
                {analysis && <span className="text-[10px] font-['JetBrains_Mono'] text-[#50c878] bg-[#0a1a0c] border border-[#1a3820] px-2 py-0.5 rounded">ANALYZED</span>}
                {isProcessing && <span className="text-[10px] font-['JetBrains_Mono'] text-[#70cc30] animate-pulse">ANALYZING...</span>}
              </div>

              {isExpanded && analysis && (
                <div className="border-t border-[#13162a] px-4 pb-4">
                  <div
                    className="prose-content text-sm leading-7 text-[#7080a8] mt-3"
                    dangerouslySetInnerHTML={{ __html: renderMd(analysis.raw) }}
                  />
                </div>
              )}

              {!analysis && !isProcessing && (
                <div className="border-t border-[#13162a] px-4 py-3">
                  {err && <div className="text-xs font-['JetBrains_Mono'] text-[#e07070] bg-[#150c0c] border border-[#3a1a1a] rounded px-3 py-2 mb-2">{err}</div>}
                  <button
                    onClick={() => analyzeChunk(chunk)}
                    disabled={!!processing}
                    className="w-full py-2 rounded-md border border-[#1e2238] bg-[#10121e] text-[#5a6080] text-xs font-semibold hover:border-[#d97c4a] hover:text-[#d97c4a] disabled:opacity-30 transition-all"
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
