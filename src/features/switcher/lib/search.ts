import { ancestorIds, type Tab } from "@/features/tabs/lib/tree";
import { displayTitle } from "@/features/tabs/lib/title";

export interface SearchResult {
  id: string;
  title: string;
  /** Ancestor titles, so two docs with the same name can be told apart. */
  path: string;
  score: number;
}

/**
 * Scores a title against the query. A title that starts with the query beats
 * one that only contains it, and a word that starts with it sits in between.
 * Anything else does not match. Simple on purpose: titles are short.
 */
function score(title: string, query: string): number {
  const haystack = title.toLowerCase();
  if (!query) return 1;
  if (haystack.startsWith(query)) return 3;
  if (haystack.includes(` ${query}`)) return 2;
  if (haystack.includes(query)) return 1;
  return 0;
}

export function searchTabs(tabs: Tab[], rawQuery: string, limit = 20): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  const titles = new Map(tabs.map((tab) => [tab.id, displayTitle(tab.title)]));

  return tabs
    .map((tab) => {
      const title = titles.get(tab.id)!;
      const path = ancestorIds(tabs, tab.id)
        .map((id) => titles.get(id))
        .join(" / ");
      return { id: tab.id, title, path, score: score(title, query) };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
