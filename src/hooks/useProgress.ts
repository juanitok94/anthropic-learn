'use client';
import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/types';

const STORAGE_KEY = 'anthropic-learn-progress';

const defaultProgress: Progress = {
  understood: {},
  lastStudied: {},
  recentlyViewed: [],
};

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress(JSON.parse(stored));
    } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((next: Progress) => {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const markUnderstood = useCallback((topicId: string, value = true) => {
    setProgress(prev => {
      const next = { ...prev, understood: { ...prev.understood, [topicId]: value }, lastStudied: { ...prev.lastStudied, [topicId]: new Date().toISOString() } };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const addRecentlyViewed = useCallback((moduleId: string) => {
    setProgress(prev => {
      const recent = [moduleId, ...prev.recentlyViewed.filter(id => id !== moduleId)].slice(0, 5);
      const next = { ...prev, recentlyViewed: recent };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { progress, loaded, save, markUnderstood, addRecentlyViewed };
}
