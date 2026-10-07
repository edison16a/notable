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
 * Writes the tab list, and deletes only the tabs (and their docs) that this
 * window removed on purpose. It must not delete "every row I do not know
 * about": with Notable open in two browser tabs, the other one may have just
 * created rows this window has never seen.
 */
export async function saveTabs(tabs: TabRecord[], removedIds: string[] = []): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.tabs, db.docs, async () => {
    if (removedIds.length) {
      await db.tabs.bulkDelete(removedIds);
      await db.docs.bulkDelete(removedIds);
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
