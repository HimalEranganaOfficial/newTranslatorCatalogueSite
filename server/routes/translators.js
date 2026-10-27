const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 12, 1), 100);
    const values = [];
    const conditions = ["t.is_published = TRUE"];

    const add = (value) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (req.query.q) {
      const parameter = add(`%${String(req.query.q).trim()}%`);
      conditions.push(`(
        t.registration_number ILIKE ${parameter}
        OR t.name ILIKE ${parameter}
        OR t.address ILIKE ${parameter}
        OR t.telephone ILIKE ${parameter}
        OR t.email ILIKE ${parameter}
        OR t.district ILIKE ${parameter}
        OR t.court ILIKE ${parameter}
        OR EXISTS (
          SELECT 1 FROM translator_languages tl_search
          WHERE tl_search.translator_id = t.id
            AND tl_search.language_pair ILIKE ${parameter}
        )
      )`);
    }
    if (req.query.language) {
      const parameter = add(`%${String(req.query.language).trim()}%`);
      conditions.push(`EXISTS (
        SELECT 1 FROM translator_languages tl_language
        WHERE tl_language.translator_id = t.id
          AND tl_language.language_pair ILIKE ${parameter}
      )`);
    }
    if (req.query.district) conditions.push(`LOWER(t.district) = LOWER(${add(String(req.query.district))})`);
    if (req.query.court) conditions.push(`LOWER(t.court) = LOWER(${add(String(req.query.court))})`);

    const where = conditions.join(" AND ");
    const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM translators t WHERE ${where}`, values);
    const offset = (page - 1) * pageSize;
    const dataValues = values.concat([pageSize, offset]);
    const result = await db.query(`
      SELECT t.id, t.directory_number AS no, t.registration_number AS r_number,
             t.name, t.address, t.telephone AS tel, t.email, t.district, t.court,
             t.featured, COALESCE(array_agg(tl.language_pair ORDER BY tl.language_pair)
               FILTER (WHERE tl.language_pair IS NOT NULL), '{}') AS languages
      FROM translators t
      LEFT JOIN translator_languages tl ON tl.translator_id = t.id
      WHERE ${where}
      GROUP BY t.id
      ORDER BY t.name ASC
      LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}
    `, dataValues);

    res.json({
      data: result.rows,
      pagination: { page, pageSize, total: countResult.rows[0].total }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
