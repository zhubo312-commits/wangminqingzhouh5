import BetterSqlite3 from "better-sqlite3";

interface CharacterSnapshot {
  glyph: string;
  canonical_status: string;
  primary_pinyin: string | null;
  naming_strokes: number | null;
  strict_kangxi_strokes: number | null;
  element: string | null;
  auspiciousness: string | null;
  source_hash: string | null;
}

export interface DatasetDiff {
  added: CharacterSnapshot[];
  removed: CharacterSnapshot[];
  changed: Array<{ glyph: string; before: CharacterSnapshot; after: CharacterSnapshot; fields: string[] }>;
  unchanged: number;
}

export class DiffService {
  compare(beforePath: string, afterPath: string): DatasetDiff {
    const before = this.read(beforePath);
    const after = this.read(afterPath);
    const added: CharacterSnapshot[] = [];
    const removed: CharacterSnapshot[] = [];
    const changed: DatasetDiff["changed"] = [];
    let unchanged = 0;
    for (const [glyph, value] of after) {
      const old = before.get(glyph);
      if (!old) { added.push(value); continue; }
      const fields = Object.keys(value).filter((key) => value[key as keyof CharacterSnapshot] !== old[key as keyof CharacterSnapshot]);
      if (fields.length) changed.push({ glyph, before: old, after: value, fields });
      else unchanged += 1;
    }
    for (const [glyph, value] of before) if (!after.has(glyph)) removed.push(value);
    return { added, removed, changed, unchanged };
  }

  private read(databasePath: string): Map<string, CharacterSnapshot> {
    const database = new BetterSqlite3(databasePath, { readonly: true, fileMustExist: true });
    try {
      const release = database.prepare(`SELECT id FROM dataset_releases WHERE status = 'released' ORDER BY released_at DESC LIMIT 1`)
        .get() as { id: string } | undefined;
      if (!release) return new Map();
      const rows = database.prepare(`
        SELECT c.glyph, c.canonical_status, cp.primary_pinyin, cp.naming_strokes, cp.strict_kangxi_strokes,
          cp.element, cp.auspiciousness, sc.content_sha256 source_hash
        FROM characters c LEFT JOIN canonical_profiles cp ON cp.character_id = c.id
        LEFT JOIN source_characters sc ON sc.id = c.source_character_id WHERE c.release_id = ? ORDER BY c.codepoint
      `).all(release.id) as CharacterSnapshot[];
      return new Map(rows.map((row) => [row.glyph, row]));
    } finally {
      database.close();
    }
  }
}
