require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../server/db");

const sourcePath = path.resolve(__dirname, "..", "data", "translators.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const text = (value) => String(value ?? "").trim();

async function importTranslators() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    for (const [index, record] of source.entries()) {
      const registrationNumber = text(record.r_number);
      const name = text(record.name);
      if (!registrationNumber || !name) continue;

      const result = await client.query(`
        INSERT INTO translators
          (registration_number, directory_number, name, address, telephone, email, district, court)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (registration_number) DO UPDATE SET
          directory_number = EXCLUDED.directory_number,
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          telephone = EXCLUDED.telephone,
          email = EXCLUDED.email,
          district = EXCLUDED.district,
          court = EXCLUDED.court,
          updated_at = NOW()
        RETURNING id
      `, [
        registrationNumber, text(record.no) || String(index + 1), name,
        text(record.address) || null, text(record.tel) || null, text(record.email) || null,
        text(record.district) || null, text(record.court) || null
      ]);

      await client.query("DELETE FROM translator_languages WHERE translator_id = $1", [result.rows[0].id]);
      const languages = Object.keys(record)
        .filter((key) => /^lang\d+$/.test(key))
        .map((key) => text(record[key]))
        .filter(Boolean);
      for (const language of languages) {
        await client.query(
          "INSERT INTO translator_languages (translator_id, language_pair) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [result.rows[0].id, language]
        );
      }
    }
    await client.query("COMMIT");
    console.log(`Imported ${source.length} directory records.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

importTranslators().catch((error) => {
  console.error("Translator import failed:", error.message);
  process.exitCode = 1;
});
