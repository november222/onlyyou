// Deterministic daily quote utilities (no storage used)
// - getTodayQuote: picks a quote based on current day index
// - useDailyQuote: React hook that returns the quote and updates at local midnight

import { useEffect, useMemo, useState } from 'react';

// Default quotes. You can localize or replace these from i18n later.
export const defaultQuotes: string[] = [
  'Love is a journey, not a destination.',
  'Small gestures, big feelings.',
  'Together is a beautiful place to be.',
  'You are my favorite notification.',
  'In a sea of people, my eyes will always search for you.',
  'The little things mean the most.',
  'Every day with you is the best day.',
  'Home is wherever I’m with you.',
  'You make my heart smile.',
  'Better together — always.',
];

/**
 * Returns milliseconds until next local midnight.
 */
export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

/**
 * Deterministically picks a quote for “today” without storage.
 * The same quote is returned throughout the day and changes automatically on the next day.
 *
 * @param quotes The list of quotes to choose from.
 * @param useLocalMidnight Whether to compute days since epoch using local midnight (default true).
 */
export function getTodayQuote(quotes: string[], useLocalMidnight: boolean = true): string {
  const list = quotes?.length ? quotes : defaultQuotes;
  let dayIndex: number;

  if (useLocalMidnight) {
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dayIndex = Math.floor(localMidnight.getTime() / 86_400_000); // ms per day
  } else {
    // UTC-based day index
    dayIndex = Math.floor(Date.now() / 86_400_000);
  }

  const idx = ((dayIndex % list.length) + list.length) % list.length; // safe modulo
  return list[idx];
}

/**
 * React hook: returns today’s deterministic quote and refreshes automatically at local midnight.
 * No storage used.
 */
export function useDailyQuote(quotes?: string[], useLocalMidnight: boolean = true): string {
  const initial = useMemo(() => getTodayQuote(quotes ?? defaultQuotes, useLocalMidnight), [quotes, useLocalMidnight]);
  const [quote, setQuote] = useState<string>(initial);

  useEffect(() => {
    // Recompute now (in case quotes array changed)
    setQuote(getTodayQuote(quotes ?? defaultQuotes, useLocalMidnight));

    // Schedule update at next local midnight
    const timeout = setTimeout(() => {
      setQuote(getTodayQuote(quotes ?? defaultQuotes, useLocalMidnight));
    }, msUntilNextLocalMidnight());

    return () => clearTimeout(timeout);
  }, [quotes, useLocalMidnight]);

  return quote;
}

