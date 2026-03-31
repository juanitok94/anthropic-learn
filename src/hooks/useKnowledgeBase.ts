'use client';
import { useState, useEffect, useCallback } from 'react';
import type { KBEntry, KnowledgeBaseData } from '@/types';
import seedData from '@/data/knowledge-base-seed.json';

const STORAGE_KEY = 'anthropic-learn-kb';
const seed = seedData as KnowledgeBaseData;

export function useKnowledgeBase() {
  const [kb, setKb] = useState<KnowledgeBaseData>({ entries: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setKb(JSON.parse(stored));
      } else if (Object.keys(seed.entries).length > 0) {
        setKb(seed);
      }
    } catch {}
    setLoaded(true);
  }, []);

  const saveEntry = useCallback((sourceId: string, entry: KBEntry) => {
    setKb(prev => {
      const next = { entries: { ...prev.entries, [sourceId]: entry } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const getEntry = useCallback((sourceId: string) => {
    return kb.entries[sourceId] ?? null;
  }, [kb]);

  const exportMarkdown = useCallback(() => {
    const lines = ['# Anthropic Knowledge Base Export', `_Generated: ${new Date().toLocaleString()}_`, '', '---', ''];
    Object.values(kb.entries).forEach(entry => {
      lines.push(`# ${entry.label}`, `_Section: ${entry.url} | Level: ${entry.level} | Mode: ${entry.mode}_`, '', entry.content, '', '---', '');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `anthropic-kb-${Date.now()}.md`;
    a.click();
  }, [kb]);

  return { kb, loaded, saveEntry, getEntry, exportMarkdown };
}
