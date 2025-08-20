/*
  # Create Truth Summaries Table for Smart Data Pipeline

  1. New Tables
    - `truth_summaries`
      - `id` (uuid, primary key)
      - `period_start` (timestamptz, when this summary period began)
      - `period_end` (timestamptz, when this summary period ended)
      - `last_processed_at` (timestamptz, latest truth timestamp in this batch)
      - `summary_json` (jsonb, GPT-5-nano's analysis)
      - `truth_count` (integer, how many truths in this summary)
      - `created_at` (timestamptz, when summary was created)

  2. Security
    - Enable RLS on `truth_summaries` table
    - Add policy for public read access (summaries are used by bot)

  3. Indexes
    - Index on created_at for efficient querying of recent summaries
    - Index on last_processed_at for incremental processing
*/

CREATE TABLE IF NOT EXISTS truth_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  last_processed_at timestamptz NOT NULL,
  summary_json jsonb NOT NULL,
  truth_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE truth_summaries ENABLE ROW LEVEL SECURITY;

-- Allow public read access for the bot to use summaries
CREATE POLICY "Allow public read access"
  ON truth_summaries
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert for the summarizer function
CREATE POLICY "Allow public insert"
  ON truth_summaries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_truth_summaries_created_at 
  ON truth_summaries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_truth_summaries_last_processed_at 
  ON truth_summaries (last_processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_truth_summaries_period 
  ON truth_summaries (period_start, period_end);