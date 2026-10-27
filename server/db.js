const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000
});

module.exports = {
  query(text, params) {
    return pool.query(text, params);
  },
  pool
};
