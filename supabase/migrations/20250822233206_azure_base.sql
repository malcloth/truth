/*
  # Create wisdoms table

  1. New Tables
    - `wisdoms`
      - `id` (uuid, primary key)
      - `x_username` (text, not null)
      - `wisdom_text` (text, not null)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `wisdoms` table
    - Add policy for public insert access
    - Add policy for public read access
  3. Triggers
    - Add trigger to update `updated_at` column automatically
*/

CREATE TABLE IF NOT EXISTS wisdoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x_username text NOT NULL,
  wisdom_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wisdoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert"
  ON wisdoms
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read access"
  ON wisdoms
  FOR SELECT
  TO anon
  USING (true);

CREATE TRIGGER update_wisdoms_updated_at
  BEFORE UPDATE ON wisdoms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wisdoms_created_at ON wisdoms USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wisdoms_username ON wisdoms USING btree (x_username);