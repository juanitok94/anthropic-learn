'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AnalysisResult, AnalysesData } from '@/types';
import seedData from '@/data/transcripts-seed.json';

const STORAGE_KEY = 'anthropic-learn-analyses';
const seed = seedData as AnalysesData;

export function useTranscriptAnalyses() {
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResult>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAnalyses(JSON.parse(stored));
      } else if (Object.keys(seed.analyses).length > 0) {
        setAnalyses(seed.analyses);
      }
    } catch {}
    setLoaded(true);
  }, []);

  const saveAnalysis = useCallback((chunkId: string, result: AnalysisResult) => {
    setAnalyses(prev => {
      const next = { ...prev, [chunkId]: result };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { analyses, loaded, saveAnalysis };
}
