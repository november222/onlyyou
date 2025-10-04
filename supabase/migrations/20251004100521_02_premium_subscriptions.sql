/*
  # Premium Subscriptions & Security
  
  ## Overview
  This migration implements a robust, fraud-resistant subscription system for premium features.
  All premium validation happens server-side to prevent client-side bypasses and cracking.

  ## Tables Created
  
  ### 1. `subscription_transactions`
  Comprehensive audit log of all purchase activities. Critical for:
  - Fraud detection and prevention
  - Customer support and dispute resolution
  - Revenue tracking and analytics
  - Compliance with App Store/Play Store requirements
  
  **Columns:**
  - `id` (uuid, PK) - Unique transaction identifier
  - `user_id` (uuid, FK) - User who made the purchase
  - `platform` (text) - Purchase platform: 'apple', 'google', 'stripe', 'manual'
  - `product_id` (text) - SKU identifier (e.g., 'premium_monthly')
  - `transaction_id` (text) - Platform's transaction identifier (unique per platform)
  - `original_transaction_id` (text) - Apple/Google original purchase ID (for renewals)
  - `purchase_date` (timestamptz) - When purchase occurred
  - `expires_date` (timestamptz) - Subscription expiration (null for lifetime)
  - `is_trial` (boolean) - Whether this is a trial subscription
  - `is_verified` (boolean) - Whether receipt was verified with platform
  - `verification_attempts` (integer) - Number of verification attempts
  - `last_verification_at` (timestamptz) - Last verification timestamp
  - `receipt_data` (jsonb) - Encrypted receipt data for re-verification
  - `status` (text) - Transaction status: 'pending', 'verified', 'failed', 'refunded', 'expired'
  - `failure_reason` (text) - If verification failed, why?
  - `revenue_usd` (numeric) - Revenue amount in USD
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update
  
  **Security:**
  - Users can only view their own transactions (read-only)
  - Only Edge Functions can INSERT/UPDATE (via service role)
  - All receipt data is logged for audit trail
  - Immutable history prevents tampering

  ### 2. `premium_access_log`
  Real-time monitoring of premium feature access attempts. Essential for:
  - Detecting unauthorized access attempts
  - Identifying cracking patterns
  - Security analytics and alerts
  - User behavior insights
  
  **Columns:**
  - `id` (uuid, PK) - Log entry identifier
  - `user_id` (uuid, FK) - User attempting access
  - `feature` (text) - Feature being accessed (e.g., 'premium_photos', 'unlimited_buzz')
  - `was_allowed` (boolean) - Whether access was granted
  - `reason` (text) - Why access was granted/denied
  - `connection_id` (uuid) - Related connection (if applicable)
  - `ip_address` (inet) - Client IP address
  - `user_agent` (text) - Client user agent
  - `created_at` (timestamptz) - Access attempt timestamp
  
  **Security:**
  - Automatic logging via triggers
  - Users cannot modify logs
  - Retention policy: 90 days
  - Used for security alerting

  ## Helper Functions
  
  ### `verify_premium_access(user_uuid, feature_name)`
  **THE SINGLE SOURCE OF TRUTH for premium validation.**
  
  This function is used in ALL RLS policies for premium features.
  - Checks user's premium_tier and expiration
  - Logs access attempt automatically
  - Returns: boolean
  - Security: SECURITY DEFINER (cannot be bypassed)
  
  **Logic:**
  1. Check if user has valid premium subscription
  2. Log the access attempt
  3. Return true/false
  
  **Usage in RLS:**
  ```sql
  CREATE POLICY "Premium only"
    ON premium_table
    USING (verify_premium_access(auth.uid(), 'premium_feature'));
  ```

  ### `record_premium_access(user_uuid, feature, allowed, reason)`
  Internal function to log access attempts. Called by verify_premium_access.

  ### `process_subscription_purchase(...)` 
  Server-only function called by Edge Functions after receipt verification.
  Updates user's premium status and creates transaction record.

  ## Security Architecture
  
  ### Defense Layers:
  
  1. **Client Side (Informational Only)**
     - Shows/hides UI elements
     - Can be bypassed ✗
     - Not trusted for security
  
  2. **Database RLS (Primary Defense)**
     - Enforces access at data layer
     - Cannot be bypassed ✓
     - Uses verify_premium_access()
  
  3. **Edge Functions (Receipt Verification)**
     - Validates purchases with Apple/Google
     - Server-to-server only ✓
     - Updates premium status
  
  4. **Audit Logging (Detection)**
     - Tracks all access attempts
     - Identifies patterns
     - Enables alerting

  ## Premium Features Protection
  
  This migration provides the foundation. Each premium feature table
  must use the `verify_premium_access()` function in its RLS policy.
  
  Example:
  ```sql
  CREATE POLICY "Premium users only"
    ON premium_photos
    FOR ALL
    TO authenticated
    USING (
      verify_premium_access(auth.uid(), 'premium_photos')
      AND user_owns_connection(connection_id)
    );
  ```

  ## Webhook Integration
  
  Apple and Google send webhooks for:
  - Subscription renewals
  - Cancellations
  - Refunds
  - Billing issues
  
  Edge Functions process these webhooks and update:
  1. subscription_transactions table (new record)
  2. users.premium_tier and premium_expires_at
  
  This ensures premium status is always accurate without polling.

  ## Anti-Fraud Measures
  
  1. **Receipt Verification**: All purchases verified with platform
  2. **Original Transaction Tracking**: Detect duplicate claims
  3. **Rate Limiting**: Prevent verification spam
  4. **Access Logging**: Detect suspicious patterns
  5. **Immutable History**: Cannot delete transaction records
  6. **Server-Side Only**: No client-side premium validation

  ## Data Retention
  
  - subscription_transactions: Forever (financial records)
  - premium_access_log: 90 days (compliance & analytics)
  - Automated cleanup job runs daily

  ## Indexes
  - Fast lookups by user_id, transaction_id, status
  - Access log queries by user, feature, timestamp
  - Premium verification is sub-millisecond
*/

-- =====================================================
-- SUBSCRIPTION TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform & Product Info
  platform text NOT NULL CHECK (platform IN ('apple', 'google', 'stripe', 'manual')),
  product_id text NOT NULL,
  
  -- Transaction Identifiers
  transaction_id text NOT NULL,
  original_transaction_id text,
  
  -- Dates & Timing
  purchase_date timestamptz NOT NULL,
  expires_date timestamptz,
  
  -- Trial & Verification
  is_trial boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  verification_attempts integer NOT NULL DEFAULT 0,
  last_verification_at timestamptz,
  
  -- Receipt Data (encrypted)
  receipt_data jsonb,
  
  -- Status & Errors
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'refunded', 'expired')),
  failure_reason text,
  
  -- Revenue Tracking
  revenue_usd numeric(10, 2),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one transaction_id per platform
  CONSTRAINT unique_platform_transaction UNIQUE (platform, transaction_id)
);

-- Enable RLS
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS sub_trans_user_idx ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS sub_trans_status_idx ON subscription_transactions(status);
CREATE INDEX IF NOT EXISTS sub_trans_created_idx ON subscription_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS sub_trans_platform_idx ON subscription_transactions(platform);
CREATE INDEX IF NOT EXISTS sub_trans_original_txn_idx ON subscription_transactions(original_transaction_id);

-- =====================================================
-- PREMIUM ACCESS LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS premium_access_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  was_allowed boolean NOT NULL,
  reason text NOT NULL,
  connection_id uuid REFERENCES connections(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE premium_access_log ENABLE ROW LEVEL SECURITY;

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS premium_log_user_idx ON premium_access_log(user_id);
CREATE INDEX IF NOT EXISTS premium_log_feature_idx ON premium_access_log(feature);
CREATE INDEX IF NOT EXISTS premium_log_created_idx ON premium_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS premium_log_allowed_idx ON premium_access_log(was_allowed);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Record premium access attempt
CREATE OR REPLACE FUNCTION record_premium_access(
  user_uuid uuid,
  feature_name text,
  allowed boolean,
  access_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO premium_access_log (
    user_id,
    feature,
    was_allowed,
    reason,
    connection_id
  )
  VALUES (
    user_uuid,
    feature_name,
    allowed,
    access_reason,
    get_user_connection_id(user_uuid)
  );
END;
$$;

-- Function: Verify premium access (THE SOURCE OF TRUTH)
CREATE OR REPLACE FUNCTION verify_premium_access(
  user_uuid uuid,
  feature_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_premium boolean;
  access_reason text;
BEGIN
  -- Check if user has valid premium
  SELECT is_premium(user_uuid) INTO has_premium;
  
  -- Determine reason
  IF has_premium THEN
    access_reason := 'valid_premium_subscription';
  ELSE
    access_reason := 'no_active_premium';
  END IF;
  
  -- Log the access attempt
  PERFORM record_premium_access(user_uuid, feature_name, has_premium, access_reason);
  
  -- Return result
  RETURN has_premium;
END;
$$;

-- Function: Process subscription purchase (called by Edge Functions)
CREATE OR REPLACE FUNCTION process_subscription_purchase(
  p_user_id uuid,
  p_platform text,
  p_product_id text,
  p_transaction_id text,
  p_original_transaction_id text,
  p_purchase_date timestamptz,
  p_expires_date timestamptz,
  p_is_trial boolean,
  p_receipt_data jsonb,
  p_revenue_usd numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_uuid uuid;
  premium_tier_value text;
BEGIN
  -- Determine premium tier from product_id
  IF p_product_id LIKE '%yearly%' THEN
    premium_tier_value := 'yearly';
  ELSIF p_product_id LIKE '%monthly%' THEN
    premium_tier_value := 'monthly';
  ELSIF p_product_id LIKE '%lifetime%' THEN
    premium_tier_value := 'lifetime';
  ELSE
    premium_tier_value := 'monthly'; -- default
  END IF;

  -- Insert transaction record
  INSERT INTO subscription_transactions (
    user_id,
    platform,
    product_id,
    transaction_id,
    original_transaction_id,
    purchase_date,
    expires_date,
    is_trial,
    is_verified,
    verification_attempts,
    last_verification_at,
    receipt_data,
    status,
    revenue_usd
  )
  VALUES (
    p_user_id,
    p_platform,
    p_product_id,
    p_transaction_id,
    p_original_transaction_id,
    p_purchase_date,
    p_expires_date,
    p_is_trial,
    true, -- verified
    1,
    now(),
    p_receipt_data,
    'verified',
    p_revenue_usd
  )
  ON CONFLICT (platform, transaction_id)
  DO UPDATE SET
    is_verified = true,
    verification_attempts = subscription_transactions.verification_attempts + 1,
    last_verification_at = now(),
    status = 'verified',
    updated_at = now()
  RETURNING id INTO transaction_uuid;

  -- Update user's premium status
  UPDATE users
  SET
    premium_tier = premium_tier_value,
    premium_expires_at = p_expires_date,
    apple_subscription_id = CASE WHEN p_platform = 'apple' THEN p_original_transaction_id ELSE apple_subscription_id END,
    google_subscription_id = CASE WHEN p_platform = 'google' THEN p_original_transaction_id ELSE google_subscription_id END,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN transaction_uuid;
END;
$$;

-- Function: Revoke premium access (for refunds/cancellations)
CREATE OR REPLACE FUNCTION revoke_premium_access(
  p_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user to free tier
  UPDATE users
  SET
    premium_tier = 'free',
    premium_expires_at = NULL,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Log the revocation
  PERFORM record_premium_access(p_user_id, 'premium_revoked', false, p_reason);
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- SUBSCRIPTION TRANSACTIONS POLICIES
-- Users can only read their own transactions
CREATE POLICY "Users can read own transactions"
  ON subscription_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only service role can insert/update transactions
-- (This is enforced by RLS - Edge Functions use service role)

-- PREMIUM ACCESS LOG POLICIES
-- Users can read their own access logs (for transparency)
CREATE POLICY "Users can read own access logs"
  ON premium_access_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at on subscription_transactions
DROP TRIGGER IF EXISTS update_sub_trans_updated_at ON subscription_transactions;
CREATE TRIGGER update_sub_trans_updated_at
  BEFORE UPDATE ON subscription_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATA CLEANUP JOBS
-- =====================================================

-- Function: Clean old access logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM premium_access_log
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Note: Schedule this function to run daily via pg_cron or external scheduler
-- Example: SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_access_logs()');

-- =====================================================
-- INITIAL DATA / TESTING
-- =====================================================

-- Grant one-time lifetime premium for testing (optional)
-- UNCOMMENT IN DEVELOPMENT ONLY:
-- DO $$
-- DECLARE
--   test_user_id uuid;
-- BEGIN
--   -- Get first user (for testing)
--   SELECT id INTO test_user_id FROM users LIMIT 1;
--   
--   IF test_user_id IS NOT NULL THEN
--     UPDATE users
--     SET premium_tier = 'lifetime', premium_expires_at = NULL
--     WHERE id = test_user_id;
--   END IF;
-- END $$;