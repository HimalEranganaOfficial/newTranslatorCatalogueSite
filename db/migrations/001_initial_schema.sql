CREATE TABLE IF NOT EXISTS translators (
  id BIGSERIAL PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  directory_number TEXT,
  name TEXT NOT NULL,
  address TEXT,
  telephone TEXT,
  email TEXT,
  district TEXT,
  court TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translator_languages (
  translator_id BIGINT NOT NULL REFERENCES translators(id) ON DELETE CASCADE,
  language_pair TEXT NOT NULL,
  PRIMARY KEY (translator_id, language_pair)
);

CREATE INDEX IF NOT EXISTS translators_district_idx ON translators (district);
CREATE INDEX IF NOT EXISTS translators_court_idx ON translators (court);
CREATE INDEX IF NOT EXISTS translator_languages_pair_idx ON translator_languages (language_pair);

CREATE TABLE IF NOT EXISTS registration_requests (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  registration_number TEXT,
  address TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  district TEXT NOT NULL,
  court TEXT,
  languages TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registration_requests_status_idx
  ON registration_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  translator_id BIGINT NOT NULL REFERENCES translators(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) BETWEEN 8 AND 1000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_translator_status_idx
  ON reviews (translator_id, status, created_at DESC);
