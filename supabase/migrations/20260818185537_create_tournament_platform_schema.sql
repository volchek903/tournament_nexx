/*
# Tournament platform core schema

## Summary
Creates the full data model for the esports tournament platform: player profiles
(with an organizer role), tournaments, tournament participants, and bracket matches.
All tournament content (tournaments, rosters, brackets) is publicly readable so
anyone can browse without an account, while creating/editing content requires
being signed in and, for tournament management, being the organizer who owns it.

## New Tables

1. `profiles`
   - `id` (uuid, primary key, references auth.users) - the account this profile belongs to
   - `username` (text, unique) - handle shown in URLs and cards
   - `display_name` (text) - shown throughout the UI
   - `avatar_url` (text, nullable) - profile picture
   - `bio` (text, nullable) - short player bio
   - `role` (text, 'player' or 'organizer') - determines access to organizer tools
   - `created_at` (timestamptz)

2. `tournaments`
   - `id` (uuid, primary key)
   - `organizer_id` (uuid, references auth.users) - who created/owns the tournament
   - `name`, `description`, `discipline` (text) - tournament info
   - `format` (text) - bracket format, currently 'single_elimination'
   - `max_participants` (integer) - bracket size (4/8/16/32)
   - `status` (text) - 'draft' | 'registration' | 'ongoing' | 'completed'
   - `start_date` (timestamptz, nullable)
   - `created_at` (timestamptz)

3. `tournament_participants`
   - `id` (uuid, primary key)
   - `tournament_id` (uuid, references tournaments)
   - `player_id` (uuid, references auth.users, nullable) - null for organizer-added placeholder entries
   - `display_name` (text) - name shown on the bracket
   - `seed` (integer, nullable)
   - `status` (text) - 'registered' | 'eliminated' | 'winner'
   - `joined_at` (timestamptz)

4. `matches`
   - `id` (uuid, primary key)
   - `tournament_id` (uuid, references tournaments)
   - `round` (integer), `match_number` (integer) - position in the bracket
   - `participant1_id`, `participant2_id` (uuid, references tournament_participants, nullable)
   - `score1`, `score2` (integer, default 0)
   - `winner_id` (uuid, references tournament_participants, nullable)
   - `status` (text) - 'pending' | 'in_progress' | 'completed'
   - `next_match_id` (uuid, references matches, nullable) - where the winner advances to
   - `created_at` (timestamptz)

## Automation
- A trigger creates a `profiles` row automatically whenever a new account signs up.

## Security
- Row Level Security is enabled on every table.
- All four tables are readable by anyone (anon + authenticated) since tournament
  content is public.
- Writes to `profiles` are restricted to the owning user.
- Writes to `tournaments` are restricted to the authenticated organizer who owns
  the row; creating a tournament additionally requires the profile's role to be
  'organizer'.
- Writes to `tournament_participants` and `matches` are restricted to the
  authenticated organizer who owns the parent tournament, except players may
  insert/delete their own participant row (join/withdraw).
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'organizer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  discipline text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'single_elimination',
  max_participants integer NOT NULL DEFAULT 8,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration', 'ongoing', 'completed')),
  start_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  seed integer,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'eliminated', 'winner')),
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  match_number integer NOT NULL,
  participant1_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  score1 integer NOT NULL DEFAULT 0,
  score2 integer NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  next_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participants_player ON tournament_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- tournaments policies
DROP POLICY IF EXISTS "tournaments_select_public" ON tournaments;
CREATE POLICY "tournaments_select_public" ON tournaments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tournaments_insert_organizer" ON tournaments;
CREATE POLICY "tournaments_insert_organizer" ON tournaments FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = organizer_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'organizer')
  );

DROP POLICY IF EXISTS "tournaments_update_owner" ON tournaments;
CREATE POLICY "tournaments_update_owner" ON tournaments FOR UPDATE
  TO authenticated USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "tournaments_delete_owner" ON tournaments;
CREATE POLICY "tournaments_delete_owner" ON tournaments FOR DELETE
  TO authenticated USING (auth.uid() = organizer_id);

-- tournament_participants policies
DROP POLICY IF EXISTS "participants_select_public" ON tournament_participants;
CREATE POLICY "participants_select_public" ON tournament_participants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "participants_insert_self_or_organizer" ON tournament_participants;
CREATE POLICY "participants_insert_self_or_organizer" ON tournament_participants FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "participants_update_organizer" ON tournament_participants;
CREATE POLICY "participants_update_organizer" ON tournament_participants FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "participants_delete_self_or_organizer" ON tournament_participants;
CREATE POLICY "participants_delete_self_or_organizer" ON tournament_participants FOR DELETE
  TO authenticated USING (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid()
    )
  );

-- matches policies
DROP POLICY IF EXISTS "matches_select_public" ON matches;
CREATE POLICY "matches_select_public" ON matches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "matches_insert_organizer" ON matches;
CREATE POLICY "matches_insert_organizer" ON matches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
  );

DROP POLICY IF EXISTS "matches_update_organizer" ON matches;
CREATE POLICY "matches_update_organizer" ON matches FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
  );

DROP POLICY IF EXISTS "matches_delete_organizer" ON matches;
CREATE POLICY "matches_delete_organizer" ON matches FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
  );

-- Auto-create a profile row when a new account signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    'player_' || substr(NEW.id::text, 1, 8),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
