import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PREFIX = "HHGOA26-";

function randomCode() {
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i += 1) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

/**
 * Generates a unique Builder ID. The database UNIQUE index is the final
 * authority; the pre-check simply avoids normal collisions.
 */
export function generateBuilderId(db) {
  const exists = db.prepare("SELECT 1 FROM builders WHERE builder_id = ? LIMIT 1");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = `${PREFIX}${randomCode()}`;
    if (!exists.get(candidate)) return candidate;
  }
  throw new Error("Could not generate a unique Builder ID.");
}

/** Assign an ID exactly once to an existing builder row. */
export function assignBuilderId(db, builderRow) {
  if (builderRow.builder_id) return builderRow.builder_id;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = generateBuilderId(db);
    try {
      const result = db.prepare(
        "UPDATE builders SET builder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND builder_id IS NULL"
      ).run(candidate, builderRow.id);
      if (result.changes === 1) return candidate;

      const current = db.prepare("SELECT builder_id FROM builders WHERE id = ?").get(builderRow.id);
      if (current?.builder_id) return current.builder_id;
    } catch (error) {
      if (!String(error?.message || "").includes("UNIQUE")) throw error;
      // A concurrent request won the same candidate; simply retry.
    }
  }

  throw new Error("Could not permanently assign a Builder ID.");
}
