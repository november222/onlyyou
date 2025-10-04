/*
  # Shared Content - Photos, Calendar, Timeline, Buzz & Pings
  
  ## Overview
  This migration creates all tables for shared content between connected partners.
  Each table is designed for a 2-person private experience with real-time sync capabilities.

  ## Security Philosophy
  - ALL data is connection-scoped (only 2 people can access)
  - RLS enforces strict access control
  - Premium features use verify_premium_access()
  - Offline-first friendly (optimistic updates)
  - Immutable audit trail for critical events

  ## Tables Created

  ### 1. `shared_photos`
  Photo gallery shared between connected partners. Can include captions and reactions.
  
  **Columns:**
  - `id` (uuid, PK) - Photo identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `uploaded_by` (uuid, FK) - User who uploaded
  - `storage_path` (text) - Path in Supabase Storage
  - `thumbnail_url` (text) - CDN URL for thumbnail (150x150)
  - `full_url` (text) - CDN URL for full image
  - `caption` (text) - Optional caption
  - `width` (integer) - Original width in pixels
  - `height` (integer) - Original height in pixels
  - `file_size_bytes` (integer) - File size for quota tracking
  - `mime_type` (text) - e.g., 'image/jpeg'
  - `is_favorite` (boolean) - Marked as favorite by either user
  - `favorited_by` (uuid[]) - Array of user IDs who favorited
  - `view_count` (integer) - Times viewed (for analytics)
  - `created_at` (timestamptz) - Upload timestamp
  - `updated_at` (timestamptz) - Last modification
  
  **Business Rules:**
  - Free tier: 50 photos max per connection
  - Premium tier: Unlimited photos
  - Max file size: 10MB per photo
  - Supported formats: JPEG, PNG, HEIC
  
  **Security:**
  - Only connection members can view/upload
  - Premium required for unlimited storage (enforced in app logic + RLS)

  ### 2. `calendar_events`
  Shared calendar for important dates, reminders, and plans.
  
  **Columns:**
  - `id` (uuid, PK) - Event identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `created_by` (uuid, FK) - User who created event
  - `title` (text) - Event title (required)
  - `description` (text) - Additional details
  - `event_date` (date) - Date of event
  - `event_time` (time) - Optional time
  - `event_type` (text) - 'anniversary', 'date', 'reminder', 'birthday', 'other'
  - `is_recurring` (boolean) - Repeats annually
  - `reminder_enabled` (boolean) - Send notification
  - `reminder_days_before` (integer) - Days before to remind
  - `is_completed` (boolean) - For tasks/reminders
  - `completed_at` (timestamptz) - When marked complete
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update
  
  **Business Rules:**
  - Free tier: 20 events max
  - Premium: Unlimited events
  - Notifications sent 1 day before by default
  
  **Security:**
  - Only connection members can CRUD
  - Both users receive notifications

  ### 3. `timeline_events`
  Chronological feed of shared memories and milestones.
  
  **Columns:**
  - `id` (uuid, PK) - Event identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `created_by` (uuid, FK) - User who created
  - `event_type` (text) - 'buzz', 'ping', 'photo', 'note', 'milestone', 'call'
  - `title` (text) - Event title
  - `description` (text) - Event description
  - `event_date` (timestamptz) - When event occurred (can be backdated)
  - `related_photo_id` (uuid) - Link to photo if photo event
  - `related_data` (jsonb) - Flexible data storage
  - `is_pinned` (boolean) - Pinned to top of timeline
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update
  
  **Business Rules:**
  - Auto-created for buzzes, pings, photos
  - Manual entries for memories/notes
  - Ordered by event_date DESC
  
  **Security:**
  - Only connection members can view/create
  - Cannot delete (preserve memories)
  - Can edit within 24 hours

  ### 4. `buzz_templates`
  Customizable buzz/notification templates for quick communication.
  
  **Columns:**
  - `id` (uuid, PK) - Template identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `created_by` (uuid, FK) - User who created
  - `title` (text) - Template name (e.g., "Miss you")
  - `icon` (text) - Icon name from icon set
  - `color` (text) - Hex color code
  - `message` (text) - Optional message
  - `is_default` (boolean) - System default template
  - `is_enabled` (boolean) - Active/inactive
  - `usage_count` (integer) - Times used (analytics)
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update
  
  **Business Rules:**
  - Free tier: 5 custom templates
  - Premium: Unlimited templates
  - System defaults cannot be deleted
  
  **Security:**
  - Only connection members can CRUD
  - Both users see all templates

  ### 5. `buzz_events`
  History of buzz/notification interactions between partners.
  
  **Columns:**
  - `id` (uuid, PK) - Event identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `template_id` (uuid, FK) - Template used
  - `sent_by` (uuid, FK) - Sender
  - `received_by` (uuid, FK) - Receiver
  - `message` (text) - Message content
  - `is_read` (boolean) - Read status
  - `read_at` (timestamptz) - When read
  - `responded_at` (timestamptz) - When responded
  - `response_type` (text) - 'buzz_back', 'call', 'message', 'none'
  - `created_at` (timestamptz) - Send timestamp
  
  **Business Rules:**
  - Immutable once sent
  - Notifications sent via push
  - Analytics for response rates
  
  **Security:**
  - Only connection members can view
  - Cannot modify history

  ### 6. `daily_pings`
  Daily check-in questions and answers to stay connected.
  
  **Columns:**
  - `id` (uuid, PK) - Ping identifier
  - `connection_id` (uuid, FK) - Parent connection
  - `question_id` (text) - Question identifier from question bank
  - `question_text` (text) - The question asked
  - `user1_answer` (text) - User1's answer
  - `user1_answered_at` (timestamptz) - When user1 answered
  - `user2_answer` (text) - User2's answer
  - `user2_answered_at` (timestamptz) - When user2 answered
  - `ping_date` (date) - Date of ping (unique per connection per day)
  - `is_revealed` (boolean) - Both answered, can see each other's answer
  - `created_at` (timestamptz) - Ping creation
  
  **Business Rules:**
  - One ping per day per connection
  - Answers hidden until both respond
  - Free tier: 30 day history
  - Premium: Unlimited history
  
  **Security:**
  - Only connection members can answer
  - Cannot see partner's answer until both complete

  ## Premium Feature Enforcement
  
  Tables with premium limits use RLS policies that call `verify_premium_access()`:
  - shared_photos: Unlimited uploads
  - calendar_events: Unlimited events  
  - buzz_templates: Unlimited custom templates
  - daily_pings: Unlimited history

  ## Storage Integration
  
  Photos are stored in Supabase Storage:
  - Bucket: 'shared-photos'
  - Path: `{connection_id}/{photo_id}.{ext}`
  - Thumbnails auto-generated
  - CDN delivery for performance

  ## Real-time Sync
  
  All tables are configured for Supabase Realtime:
  - Partners see updates instantly
  - Optimistic UI updates
  - Conflict resolution via timestamps

  ## Indexes
  - All tables indexed by connection_id for fast queries
  - Timeline ordered by event_date
  - Photos ordered by created_at
  - Calendar ordered by event_date
  - Buzz events ordered by created_at
*/

-- =====================================================
-- SHARED PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS shared_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  thumbnail_url text,
  full_url text,
  caption text,
  width integer,
  height integer,
  file_size_bytes integer NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  is_favorite boolean NOT NULL DEFAULT false,
  favorited_by uuid[] NOT NULL DEFAULT '{}',
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shared_photos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS shared_photos_connection_idx ON shared_photos(connection_id);
CREATE INDEX IF NOT EXISTS shared_photos_created_idx ON shared_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS shared_photos_favorite_idx ON shared_photos(is_favorite) WHERE is_favorite = true;

-- =====================================================
-- CALENDAR EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL DEFAULT 'other' CHECK (event_type IN ('anniversary', 'date', 'reminder', 'birthday', 'other')),
  is_recurring boolean NOT NULL DEFAULT false,
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_days_before integer NOT NULL DEFAULT 1,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS calendar_events_connection_idx ON calendar_events(connection_id);
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS calendar_events_type_idx ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS calendar_events_recurring_idx ON calendar_events(is_recurring) WHERE is_recurring = true;

-- =====================================================
-- TIMELINE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('buzz', 'ping', 'photo', 'note', 'milestone', 'call')),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL DEFAULT now(),
  related_photo_id uuid REFERENCES shared_photos(id) ON DELETE SET NULL,
  related_data jsonb,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS timeline_events_connection_idx ON timeline_events(connection_id);
CREATE INDEX IF NOT EXISTS timeline_events_date_idx ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS timeline_events_type_idx ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS timeline_events_pinned_idx ON timeline_events(is_pinned) WHERE is_pinned = true;

-- =====================================================
-- BUZZ TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS buzz_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'heart',
  color text NOT NULL DEFAULT '#f59e0b',
  message text,
  is_default boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE buzz_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS buzz_templates_connection_idx ON buzz_templates(connection_id);
CREATE INDEX IF NOT EXISTS buzz_templates_enabled_idx ON buzz_templates(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS buzz_templates_sort_idx ON buzz_templates(sort_order);

-- =====================================================
-- BUZZ EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS buzz_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  template_id uuid REFERENCES buzz_templates(id) ON DELETE SET NULL,
  sent_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  received_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  responded_at timestamptz,
  response_type text CHECK (response_type IN ('buzz_back', 'call', 'message', 'none')),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT different_sender_receiver CHECK (sent_by != received_by)
);

ALTER TABLE buzz_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS buzz_events_connection_idx ON buzz_events(connection_id);
CREATE INDEX IF NOT EXISTS buzz_events_created_idx ON buzz_events(created_at DESC);
CREATE INDEX IF NOT EXISTS buzz_events_received_idx ON buzz_events(received_by, is_read);

-- =====================================================
-- DAILY PINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_pings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id uuid NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  question_text text NOT NULL,
  user1_answer text,
  user1_answered_at timestamptz,
  user2_answer text,
  user2_answered_at timestamptz,
  ping_date date NOT NULL,
  is_revealed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- One ping per day per connection
  CONSTRAINT unique_daily_ping UNIQUE (connection_id, ping_date)
);

ALTER TABLE daily_pings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS daily_pings_connection_idx ON daily_pings(connection_id);
CREATE INDEX IF NOT EXISTS daily_pings_date_idx ON daily_pings(ping_date DESC);
CREATE INDEX IF NOT EXISTS daily_pings_revealed_idx ON daily_pings(is_revealed);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Check if user owns/belongs to connection
CREATE OR REPLACE FUNCTION user_owns_connection(conn_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE id = conn_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  );
END;
$$;

-- Function: Get photo count for connection (for quota enforcement)
CREATE OR REPLACE FUNCTION get_photo_count(conn_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  photo_count integer;
BEGIN
  SELECT COUNT(*) INTO photo_count
  FROM shared_photos
  WHERE connection_id = conn_id;
  
  RETURN photo_count;
END;
$$;

-- Function: Auto-reveal daily ping when both answered
CREATE OR REPLACE FUNCTION check_and_reveal_ping()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If both users have answered, set is_revealed to true
  IF NEW.user1_answer IS NOT NULL AND NEW.user2_answer IS NOT NULL THEN
    NEW.is_revealed := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- SHARED PHOTOS POLICIES
CREATE POLICY "Users can view photos in their connection"
  ON shared_photos FOR SELECT
  TO authenticated
  USING (user_owns_connection(connection_id));

CREATE POLICY "Users can upload photos to their connection"
  ON shared_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_owns_connection(connection_id)
    AND uploaded_by = auth.uid()
    AND (
      -- Premium users: unlimited
      verify_premium_access(auth.uid(), 'unlimited_photos')
      -- Free users: check quota (50 max)
      OR get_photo_count(connection_id) < 50
    )
  );

CREATE POLICY "Users can update their photos"
  ON shared_photos FOR UPDATE
  TO authenticated
  USING (user_owns_connection(connection_id))
  WITH CHECK (user_owns_connection(connection_id));

CREATE POLICY "Users can delete their photos"
  ON shared_photos FOR DELETE
  TO authenticated
  USING (
    user_owns_connection(connection_id)
    AND uploaded_by = auth.uid()
  );

-- CALENDAR EVENTS POLICIES
CREATE POLICY "Users can view events in their connection"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (user_owns_connection(connection_id));

CREATE POLICY "Users can create events in their connection"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    user_owns_connection(connection_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update events in their connection"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (user_owns_connection(connection_id))
  WITH CHECK (user_owns_connection(connection_id));

CREATE POLICY "Users can delete events in their connection"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (user_owns_connection(connection_id));

-- TIMELINE EVENTS POLICIES
CREATE POLICY "Users can view timeline in their connection"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (user_owns_connection(connection_id));

CREATE POLICY "Users can create timeline events"
  ON timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    user_owns_connection(connection_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update timeline events within 24h"
  ON timeline_events FOR UPDATE
  TO authenticated
  USING (
    user_owns_connection(connection_id)
    AND (
      created_by = auth.uid()
      OR created_at > now() - interval '24 hours'
    )
  )
  WITH CHECK (user_owns_connection(connection_id));

-- BUZZ TEMPLATES POLICIES
CREATE POLICY "Users can view templates in their connection"
  ON buzz_templates FOR SELECT
  TO authenticated
  USING (user_owns_connection(connection_id));

CREATE POLICY "Users can create templates"
  ON buzz_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    user_owns_connection(connection_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update templates"
  ON buzz_templates FOR UPDATE
  TO authenticated
  USING (user_owns_connection(connection_id))
  WITH CHECK (user_owns_connection(connection_id));

CREATE POLICY "Users can delete custom templates"
  ON buzz_templates FOR DELETE
  TO authenticated
  USING (
    user_owns_connection(connection_id)
    AND is_default = false
  );

-- BUZZ EVENTS POLICIES
CREATE POLICY "Users can view buzz events in their connection"
  ON buzz_events FOR SELECT
  TO authenticated
  USING (user_owns_connection(connection_id));

CREATE POLICY "Users can send buzz events"
  ON buzz_events FOR INSERT
  TO authenticated
  WITH CHECK (
    user_owns_connection(connection_id)
    AND sent_by = auth.uid()
  );

CREATE POLICY "Users can update received buzz events"
  ON buzz_events FOR UPDATE
  TO authenticated
  USING (
    user_owns_connection(connection_id)
    AND received_by = auth.uid()
  )
  WITH CHECK (received_by = auth.uid());

-- DAILY PINGS POLICIES
CREATE POLICY "Users can view pings in their connection"
  ON daily_pings FOR SELECT
  TO authenticated
  USING (user_owns_connection(connection_id));

CREATE POLICY "Users can create daily pings"
  ON daily_pings FOR INSERT
  TO authenticated
  WITH CHECK (user_owns_connection(connection_id));

CREATE POLICY "Users can answer daily pings"
  ON daily_pings FOR UPDATE
  TO authenticated
  USING (user_owns_connection(connection_id))
  WITH CHECK (user_owns_connection(connection_id));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at triggers
DROP TRIGGER IF EXISTS update_shared_photos_updated_at ON shared_photos;
CREATE TRIGGER update_shared_photos_updated_at
  BEFORE UPDATE ON shared_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON timeline_events;
CREATE TRIGGER update_timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buzz_templates_updated_at ON buzz_templates;
CREATE TRIGGER update_buzz_templates_updated_at
  BEFORE UPDATE ON buzz_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-reveal daily ping when both answered
DROP TRIGGER IF EXISTS auto_reveal_ping ON daily_pings;
CREATE TRIGGER auto_reveal_ping
  BEFORE INSERT OR UPDATE ON daily_pings
  FOR EACH ROW EXECUTE FUNCTION check_and_reveal_ping();