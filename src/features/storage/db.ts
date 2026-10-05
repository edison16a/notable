import Dexie, { type Table } from "dexie";
import type { JSONContent } from "@tiptap/core";

/** The body of one doc, stored as Tiptap JSON so it round-trips without loss. */
export interface DocRecord {
  id: string;
  content: JSONContent | null;
  updatedAt: number;
}

/**
 * One row in the sidebar. The tree is stored flat (parent plus order) because
 * moving a tab then only rewrites the rows that changed, not a nested blob.
 */
export interface TabRecord {
  id: string;
  parentId: string | null;
  order: number;
  title: string;
  /** True once the user renames the tab, after which the doc heading stops driving the title. */
  customTitle: boolean;
  folded: boolean;
  createdAt: number;
}

/** Small key-value settings: active tab, sidebar width, chosen voice, and so on. */
export interface MetaRecord {
  key: string;
  value: unknown;
}

class NotableDatabase extends Dexie {
  docs!: Table<DocRecord, string>;
  tabs!: Table<TabRecord, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super("notable");
    this.version(1).stores({
      docs: "id",
      tabs: "id, parentId",
      meta: "key",
    });
  }
}

let instance: NotableDatabase | null = null;

/** Opened lazily so importing this module during server rendering never touches IndexedDB. */
export function getDb(): NotableDatabase {
  instance ??= new NotableDatabase();
  return instance;
}
