import type { JSONContent } from "@tiptap/core";
import { getDb, type TabRecord } from "./db";

/*
 * Thin async wrappers over the database. Components never talk to Dexie
 * directly, which keeps the schema in one place.
 */

export async function loadDoc(id: string): Promise<JSONContent | null> {
  const record = await getDb().docs.get(id);
  return record?.content ?? null;
}

export async function saveDoc(id: string, content: JSONContent): Promise<void> {
  await getDb().docs.put({ id, content, updatedAt: Date.now() });
}

export async function loadAllDocs(): Promise<Map<string, JSONContent | null>> {
  const rows = await getDb().docs.toArray();
  return new Map(rows.map((row) => [row.id, row.content]));
}

export async function loadTabs(): Promise<TabRecord[]> {
  return getDb().tabs.toArray();
}

/**
 * Writes the whole tab list and removes rows that no longer exist, along with
 * their docs. Trees are small (hundreds of rows at most), so a full sync in
 * one transaction is simpler and safer than tracking individual edits.
 */
export async function saveTabs(tabs: TabRecord[]): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.tabs, db.docs, async () => {
    const keep = new Set(tabs.map((tab) => tab.id));
    const existing = await db.tabs.toCollection().primaryKeys();
    const removed = existing.filter((id) => !keep.has(id));
    if (removed.length) {
      await db.tabs.bulkDelete(removed);
      await db.docs.bulkDelete(removed);
    }
    await db.tabs.bulkPut(tabs);
  });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await getDb().meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await getDb().meta.put({ key, value });
}
