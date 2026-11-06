CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner')),
  value_mg_dl INTEGER NOT NULL CHECK (value_mg_dl BETWEEN 40 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX IF NOT EXISTS readings_user_date_idx ON readings (user_id, reading_date);

-- Calendar days use India Standard Time throughout the app.
CREATE OR REPLACE FUNCTION reject_future_reading() RETURNS trigger AS $$
BEGIN
  IF NEW.reading_date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'Date cannot be in the future.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS readings_no_future ON readings;
CREATE TRIGGER readings_no_future BEFORE INSERT OR UPDATE ON readings
FOR EACH ROW EXECUTE FUNCTION reject_future_reading();
