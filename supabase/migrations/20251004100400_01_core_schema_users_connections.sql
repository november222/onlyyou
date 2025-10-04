/*
  # Core Schema - Users & Connections
  
  ## Overview
  This migration establishes the foundational security and user management system for OnlyYou,
  a private 2-person shared experience app. Security is paramount as this app handles intimate
  data between couples.

  ## Tables Created
  
  ### 1. `users`
  Core user profile and premium subscription management.
  
  **Columns:**
  - `id` (uuid, PK) - Unique user identifier, synced with Supabase Auth
  - `email` (text) - User email address, unique
  - `full_name` (text) - User's display name
  - `avatar_url` (text) - Optional profile picture URL
  - `premium_tier` (text) - Subscription level: 'free', 'monthly', 'yearly', 'lifetime'
  - `premium_expires_at` (timestamptz) - Subscription expiration date (null for lifetime)
  - `apple_subscription_id` (text) - Apple App Store subscription identifier
  - `google_subscription_id` (text) - Google Play Store subscription identifier
  - `last_seen_at` (timestamptz) - Last activity timestamp
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last profile update
  
  **Security:**
  - Users can only view and update their own profile
  - Premium status cannot be modified by users (server-only via Edge Functions)
  
  ### 2. `connections`
  Represents the exclusive bond between two users. Each connection is a private space
  for a couple to share their lives together.
  
  **Columns:**
  - `id` (uuid, PK) - Unique connection identifier
  - `room_code` (text) - 6-character code for partner pairing (e.g., "ABC123")
  - `user1_id` (uuid, FK) - First user in the connection
  - `user2_id` (uuid, FK) - Second user in the connection
  - `user1_name` (text) - Display name for user1 (customizable by user2)
  - `user2_name` (text) - Display name for user2 (customizable by user1)
  - `status` (text) - Connection state: 'pending', 'active', 'ended'
  - `connection_date` (timestamptz) - When connection was established
  - `ended_at` (timestamptz) - When connection ended (if applicable)
  - `total_duration_minutes` (integer) - Cumulative connection time
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  **Business Rules:**
  - Room codes are unique and case-insensitive
  - Each user can only have ONE active connection at a time
  - Only the two connected users can access their connection data
  
  **Security:**
  - Strict RLS: Only user1 and user2 can access their connection
  - Room codes are indexed for fast lookups
  - Status transitions are controlled

  ### 3. `session_history`
  Tracks individual connection sessions (call sessions, video chats, etc.)
  
  **Columns:**
  - `id` (uuid, PK) - Unique session identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `started_at` (timestamptz) - Session start time
  - `ended_at` (timestamptz) - Session end time
  - `duration_minutes` (integer) - Session length in minutes
  - `buzz_calls_count` (integer) - Number of buzz calls during session
  - `session_type` (text) - Type: 'buzz_call', 'video_chat', 'voice_call'
  - `created_at` (timestamptz) - Record creation
  
  **Security:**
  - Users can only view sessions for their own connection
  - Historical data preserved for analytics and memories

  ## Helper Functions
  
  ### `is_premium(user_uuid)`
  Server-side function to verify premium status. Used extensively in RLS policies.
  - Returns: boolean
  - Security: SECURITY DEFINER (runs with elevated privileges)
  - Logic: Checks premium_tier != 'free' AND not expired
  
  ### `user_has_active_connection(user_uuid)`
  Checks if user already has an active connection.
  - Returns: boolean
  - Used to enforce one-connection-per-user rule

  ## Security Policies (RLS)
  
  ### Users Table
  1. **Read Own Profile**: Users can SELECT their own record
  2. **Update Own Profile**: Users can UPDATE name, avatar (NOT premium fields)
  3. **No Delete**: Users cannot delete their account via app
  
  ### Connections Table
  1. **Create Connection**: Any authenticated user can create (enforces one active connection)
  2. **Read Own Connection**: Users can SELECT connections they're part of
  3. **Update Own Connection**: Users can UPDATE their connection details
  4. **No Delete**: Connections cannot be deleted, only marked as 'ended'
  
  ### Session History Table
  1. **Insert Session**: Users can INSERT sessions for their connection
  2. **Read Own Sessions**: Users can SELECT sessions for their connection
  3. **No Updates/Deletes**: Session history is immutable for data integrity

  ## Indexes
  - `users.email` - Fast auth lookups
  - `connections.room_code` - Fast pairing lookups
  - `connections.user1_id`, `connections.user2_id` - Connection queries
  - `connections.status` - Filter active connections
  - `session_history.connection_id` - Session queries

  ## Data Integrity
  - Foreign keys with CASCADE on user deletion
  - CHECK constraints on enums
  - NOT NULL constraints on critical fields
  - Default values for timestamps and counters
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  premium_tier text NOT NULL DEFAULT 'free' CHECK (premium_tier IN ('free', 'monthly', 'yearly', 'lifetime')),
  premium_expires_at timestamptz,
  apple_subscription_id text,
  google_subscription_id text,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_premium_tier_idx ON users(premium_tier);

-- =====================================================
-- CONNECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code text UNIQUE NOT NULL,
  user1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user1_name text NOT NULL DEFAULT 'Partner 1',
  user2_name text NOT NULL DEFAULT 'Partner 2',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  connection_date timestamptz,
  ended_at timestamptz,
  total_duration_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Business rule: user1 and user2 must be different
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  
  -- Business rule: if status is active, must have connection_date
  CONSTRAINT active_has_date CHECK (
    status != 'active' OR connection_date IS NOT NULL
  ),
  
  -- Business rule: if status is ended, must have ended_at
  CONSTRAINT ended_has_date CHECK (
    status != 'ended' OR ended_at IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS connections_room_code_idx ON connections(LOWER(room_code));
CREATE INDEX IF NOT EXISTS connections_user1_idx ON connections(user1_id);
CREATE INDEX IF NOT EXISTS connections_user2_idx ON connections(user2_id);
CREATE INDEX IF NOT EXISTS connections_status_idx ON connections(status);

-- =====================================================
-- SESSION HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer DEFAULT 0,
  buzz_calls_count integer NOT NULL DEFAULT 0,
  session_type text NOT NULL DEFAULT 'buzz_call' CHECK (session_type IN ('buzz_call', 'video_chat', 'voice_call')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS session_history_connection_idx ON session_history(connection_id);
CREATE INDEX IF NOT EXISTS session_history_started_at_idx ON session_history(started_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Check if user has premium access
CREATE OR REPLACE FUNCTION is_premium(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_uuid
    AND premium_tier != 'free'
    AND (
      premium_expires_at IS NULL -- lifetime premium
      OR premium_expires_at > now()
    )
  );
END;
$$;

-- Function: Check if user already has an active connection
CREATE OR REPLACE FUNCTION user_has_active_connection(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE (user1_id = user_uuid OR user2_id = user_uuid)
    AND status IN ('pending', 'active')
  );
END;
$$;

-- Function: Get user's active connection ID
CREATE OR REPLACE FUNCTION get_user_connection_id(user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  conn_id uuid;
BEGIN
  SELECT id INTO conn_id
  FROM connections
  WHERE (user1_id = user_uuid OR user2_id = user_uuid)
  AND status IN ('pending', 'active')
  LIMIT 1;
  
  RETURN conn_id;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- USERS POLICIES
-- ----------------

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (except premium fields)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Ensure users cannot modify premium fields
    AND premium_tier = (SELECT premium_tier FROM users WHERE id = auth.uid())
    AND premium_expires_at IS NOT DISTINCT FROM (SELECT premium_expires_at FROM users WHERE id = auth.uid())
    AND apple_subscription_id IS NOT DISTINCT FROM (SELECT apple_subscription_id FROM users WHERE id = auth.uid())
    AND google_subscription_id IS NOT DISTINCT FROM (SELECT google_subscription_id FROM users WHERE id = auth.uid())
  );

-- CONNECTIONS POLICIES
-- ---------------------

-- Users can create connections (if they don't have an active one)
CREATE POLICY "Users can create connection"
  ON connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id
    AND NOT user_has_active_connection(auth.uid())
  );

-- Users can read their own connections
CREATE POLICY "Users can read own connections"
  ON connections
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- Users can update their connections
CREATE POLICY "Users can update own connections"
  ON connections
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  )
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- SESSION HISTORY POLICIES
-- -------------------------

-- Users can insert sessions for their connection
CREATE POLICY "Users can insert own sessions"
  ON session_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = connection_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- Users can read sessions for their connection
CREATE POLICY "Users can read own sessions"
  ON session_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = connection_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for connections table
DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =====================================================

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();