/*
  # Create user truths table for storing community wisdom

  1. New Tables
    - `user_truths`
      - `id` (uuid, primary key)
      - `x_username` (text, the user's X/Twitter username)
      - `first_question` (text, the first AI-generated question)
      - `first_answer` (text, user's response to first question)
      - `second_question` (text, the second AI-generated question)
      - `second_answer` (text, user's response to second question)
      - `generated_truth` (text, the AI-generated truth based on both answers)
      - `created_at` (timestamp, when the truth was generated)
      - `updated_at` (timestamp, when the record was last updated)

  2. Security
    - Enable RLS on `user_truths` table
    - Add policy for public read access (for generating wisdom tweets)
    - Add policy for public insert access (for storing new truths)

  3. Indexes
    - Add index on created_at for efficient querying by date
    - Add index on x_username for user lookups
*/

CREATE TABLE IF NOT EXISTS user_truths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x_username text NOT NULL,
  first_question text NOT NULL,
  first_answer text NOT NULL,
  second_question text NOT NULL,
  second_answer text NOT NULL,
  generated_truth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_truths ENABLE ROW LEVEL SECURITY;

-- Allow public read access for generating wisdom content
CREATE POLICY "Allow public read access"
  ON user_truths
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert for storing new truths
CREATE POLICY "Allow public insert"
  ON user_truths
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_truths_created_at ON user_truths(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_truths_username ON user_truths(x_username);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_truths_updated_at
  BEFORE UPDATE ON user_truths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();