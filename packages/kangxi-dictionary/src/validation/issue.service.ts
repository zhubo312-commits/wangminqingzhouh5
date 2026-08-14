import type BetterSqlite3 from "better-sqlite3";
import { nowIso } from "../shared/database.js";
import { NotFoundError, ValidationFailedError } from "../shared/errors.js";

export class IssueService {
  constructor(private readonly database: BetterSqlite3.Database) {}

  resolve(id: number, note: string, acceptSourceAbsence = false): void {
    const row = this.database.prepare("SELECT code, resolution_status FROM validation_issues WHERE id = ?")
      .get(id) as { code: string; resolution_status: string } | undefined;
    if (!row) throw new NotFoundError("validation issue", String(id));
    if (acceptSourceAbsence && !row.code.includes("SOURCE_MISSING")) {
      throw new ValidationFailedError("Only source-missing issues may use accepted_source_absence", { issueId: id, code: row.code });
    }
    this.database.prepare(`
      UPDATE validation_issues SET resolution_status = ?, resolution_note = ?, updated_at = ? WHERE id = ?
    `).run(acceptSourceAbsence ? "accepted_source_absence" : "resolved", note, nowIso(), id);
  }
}
