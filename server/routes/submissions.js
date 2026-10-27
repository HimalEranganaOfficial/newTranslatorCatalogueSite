const express = require("express");
const db = require("../db");

const router = express.Router();
const requiredText = (value) => typeof value === "string" && value.trim().length > 0;

router.post("/registrations", async (req, res, next) => {
  const { name, registration_number, address, telephone, email, district, court, languages } = req.body;
  if (![name, address, telephone, district, languages].every(requiredText)) {
    return res.status(400).json({ error: "Name, address, telephone, district and languages are required." });
  }
  try {
    const result = await db.query(`
      INSERT INTO registration_requests
        (name, registration_number, address, telephone, email, district, court, languages)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, status, created_at
    `, [
      name.trim(), registration_number?.trim() || null, address.trim(), telephone.trim(),
      email?.trim() || null, district.trim(), court?.trim() || null, languages.trim()
    ]);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post("/reviews", async (req, res, next) => {
  const { registration_number, author, rating, text } = req.body;
  const numericRating = Number(rating);
  if (!requiredText(registration_number) || !requiredText(text)
      || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5
      || text.trim().length < 8 || text.trim().length > 1000) {
    return res.status(400).json({ error: "A translator, rating from 1 to 5, and 8–1000 characters of feedback are required." });
  }
  try {
    const result = await db.query(`
      INSERT INTO reviews (translator_id, author, rating, review_text)
      SELECT id, $2, $3, $4
      FROM translators
      WHERE registration_number = $1 AND is_published = TRUE
      RETURNING id, status, created_at
    `, [registration_number.trim(), author?.trim() || "Anonymous", numericRating, text.trim()]);
    if (!result.rows.length) return res.status(404).json({ error: "Translator not found." });
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
