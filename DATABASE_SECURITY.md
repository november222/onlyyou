# Database & Security Architecture

## Overview

OnlyYou app uses Supabase as its backend with a comprehensive security architecture designed to prevent unauthorized access and ensure data integrity. This document outlines the security measures implemented to protect premium features and user data.

## Database Schema

### Core Tables

1. **users** - User profiles and premium subscription status
2. **connections** - 2-person exclusive connections
3. **session_history** - Connection session tracking
4. **shared_photos** - Photo gallery between partners
5. **calendar_events** - Shared calendar
6. **timeline_events** - Shared timeline/memories
7. **buzz_templates** - Custom buzz/notification templates
8. **buzz_events** - Buzz interaction history
9. **daily_pings** - Daily check-in questions
10. **subscription_transactions** - Purchase audit log
11. **premium_access_log** - Security monitoring

### Relationships

```
users (1) ─────────── (1-2) connections
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   shared_photos    calendar_events  timeline_events
   buzz_templates   buzz_events      daily_pings
   session_history
```

## Security Architecture

### 1. Multi-Layer Defense

```
┌─────────────────────────────────────────────────────────┐
│ CLIENT SIDE (UI Only - NOT Trusted)                     │
│ - Show/hide premium features                            │
│ - Visual feedback                                       │
│ - Can be bypassed ✗                                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ API Calls with JWT
                      ▼
┌─────────────────────────────────────────────────────────┐
│ ROW LEVEL SECURITY (Primary Defense)                    │
│ - Database-level access control                         │
│ - verify_premium_access() function                      │
│ - Cannot be bypassed ✓                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Server-to-Server
                      ▼
┌─────────────────────────────────────────────────────────┐
│ EDGE FUNCTIONS (Receipt Verification)                   │
│ - Verify purchases with Apple/Google                    │
│ - Update premium status                                 │
│ - Server-only access ✓                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Audit Trail
                      ▼
┌─────────────────────────────────────────────────────────┐
│ PREMIUM ACCESS LOG (Detection)                          │
│ - Track all access attempts                             │
│ - Identify suspicious patterns                          │
│ - Security analytics ✓                                  │
└─────────────────────────────────────────────────────────┘
```

### 2. Premium Feature Protection

#### Server-Side Validation (THE SOURCE OF TRUTH)

All premium features use the `verify_premium_access()` database function:

```sql
CREATE POLICY "Premium users only"
  ON premium_feature_table
  FOR ALL
  TO authenticated
  USING (
    verify_premium_access(auth.uid(), 'feature_name')
    AND user_owns_connection(connection_id)
  );
```

This function:
1. Checks user's `premium_tier` and `premium_expires_at`
2. Logs the access attempt to `premium_access_log`
3. Returns boolean result
4. Runs with SECURITY DEFINER (cannot be bypassed)

#### Why Client-Side Checks Don't Work

```typescript
// ❌ INSECURE - Can be easily bypassed
const isPremium = await AsyncStorage.getItem('premium');
if (isPremium === '1') {
  // Show premium feature
}

// User can simply do:
await AsyncStorage.setItem('premium', '1');
// → Free premium access!
```

#### Secure Implementation

```typescript
// ✅ SECURE - Server validates everything
const { data, error } = await supabase
  .from('premium_photos')
  .insert({ ... }); // RLS blocks if not premium

// Database RLS policy enforces:
// - User must be authenticated
// - User must have valid premium subscription
// - User must own the connection
// - All checks happen server-side
```

### 3. Receipt Verification Flow

```
┌──────────┐         ┌──────────┐         ┌─────────────┐
│  Client  │         │   Edge   │         │ Apple/Google│
│   App    │────────>│ Function │────────>│   Servers   │
└──────────┘         └──────────┘         └─────────────┘
     │                     │                      │
     │ 1. Purchase         │                      │
     │                     │ 2. Verify Receipt    │
     │                     │<─────────────────────│
     │                     │ 3. Valid!            │
     │                     │                      │
     │                     ▼                      │
     │              ┌─────────────┐               │
     │              │  Database   │               │
     │              │  (Update    │               │
     │              │   Premium)  │               │
     │              └─────────────┘               │
     │<─────────────────┘                         │
     │ 4. Success Response                        │
```

Steps:
1. Client initiates purchase via App Store/Play Store
2. Client sends receipt to Edge Function
3. Edge Function verifies receipt with Apple/Google servers
4. If valid, Edge Function calls `process_subscription_purchase()`
5. Database updates user's `premium_tier` and `premium_expires_at`
6. All subsequent API calls now pass RLS checks

### 4. Anti-Fraud Measures

#### Transaction Logging
Every purchase is logged in `subscription_transactions`:
- Transaction ID (unique per platform)
- Original transaction ID (for renewals)
- Receipt data (encrypted)
- Verification status
- Revenue tracking
- Immutable audit trail

#### Access Monitoring
Every premium feature access is logged in `premium_access_log`:
- User ID
- Feature accessed
- Whether access was granted
- Reason (valid_premium / no_active_premium)
- IP address and user agent
- Timestamp

This enables:
- Detecting unauthorized access attempts
- Identifying cracking patterns
- Security analytics and alerting
- Fraud investigation

#### Rate Limiting
Implemented at multiple levels:
- API rate limiting per user
- Purchase verification rate limiting
- Access log prevents spam

### 5. Data Isolation

#### Connection-Scoped Data
All shared content is scoped to a connection:

```sql
CREATE POLICY "Users can view photos in their connection"
  ON shared_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = connection_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );
```

This ensures:
- Only 2 people in a connection can access data
- No data leakage between connections
- Perfect isolation for privacy

#### One Active Connection Per User
Database enforces business rule:

```sql
CREATE POLICY "Users can create connection"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id
    AND NOT user_has_active_connection(auth.uid())
  );
```

### 6. Session Management

#### JWT-Based Authentication
- Supabase Auth handles JWT tokens
- Auto-refresh for seamless experience
- Session stored in AsyncStorage (encrypted)
- Server validates every request

#### Secure Session Storage
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Encrypted on device
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Premium Tiers

### Free Tier Limits
- 50 photos max
- 20 calendar events max
- 5 custom buzz templates
- 30-day ping history

### Premium Benefits
- Unlimited photos
- Unlimited calendar events
- Unlimited buzz templates
- Unlimited ping history
- Priority support

### Implementation
Limits enforced via RLS policies:

```sql
CREATE POLICY "Users can upload photos to their connection"
  ON shared_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_owns_connection(connection_id)
    AND uploaded_by = auth.uid()
    AND (
      -- Premium: unlimited
      verify_premium_access(auth.uid(), 'unlimited_photos')
      -- Free: check quota
      OR get_photo_count(connection_id) < 50
    )
  );
```

## Security Best Practices

### DO ✅
1. **Always validate on server** - Use RLS policies
2. **Log all premium access** - Enable monitoring
3. **Verify receipts server-side** - Use Edge Functions
4. **Keep audit trail** - Immutable transaction log
5. **Monitor access patterns** - Detect anomalies
6. **Use SECURITY DEFINER** - For critical functions
7. **Implement rate limiting** - Prevent abuse

### DON'T ❌
1. **Never trust client** - Client can be modified
2. **Don't store premium status locally** - Can be edited
3. **Don't skip receipt verification** - Opens fraud
4. **Don't allow direct DB updates** - Use RLS
5. **Don't expose service role key** - Client uses anon key only
6. **Don't skip logging** - Needed for security
7. **Don't modify transaction history** - Keep immutable

## Testing Premium Features

### Development Mode
Edge Function uses test mode when secrets not configured:
```typescript
if (!appleSharedSecret) {
  console.warn('APPLE_SHARED_SECRET not configured. Using test mode.');
  // Accept any receipt for testing
  isValid = true;
  // ...
}
```

### Testing RLS Policies
```sql
-- Test as specific user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uuid-here';

-- Try to access premium feature
SELECT * FROM shared_photos WHERE connection_id = 'conn-id';

-- Should block if not premium
```

### Monitoring Access Logs
```sql
-- View recent access attempts
SELECT
  u.email,
  pal.feature,
  pal.was_allowed,
  pal.reason,
  pal.created_at
FROM premium_access_log pal
JOIN users u ON u.id = pal.user_id
ORDER BY pal.created_at DESC
LIMIT 100;

-- Find suspicious patterns
SELECT
  user_id,
  COUNT(*) as attempt_count,
  SUM(CASE WHEN was_allowed THEN 0 ELSE 1 END) as blocked_count
FROM premium_access_log
WHERE created_at > now() - interval '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100; -- Unusual activity
```

## Incident Response

### If Premium Bypass Detected

1. **Immediate Actions**
   - Check `premium_access_log` for patterns
   - Identify affected users
   - Revoke unauthorized premium access

2. **Investigation**
   ```sql
   -- Find unauthorized access
   SELECT * FROM premium_access_log
   WHERE was_allowed = true
   AND user_id NOT IN (
     SELECT id FROM users WHERE premium_tier != 'free'
   );
   ```

3. **Remediation**
   ```sql
   -- Revoke premium for specific user
   SELECT revoke_premium_access(
     'user-uuid',
     'security_incident_unauthorized_access'
   );
   ```

### Monitoring Alerts

Set up alerts for:
- High volume of blocked access attempts
- Premium access without valid subscription
- Unusual purchase patterns
- Receipt verification failures

## Conclusion

OnlyYou's security architecture is designed with defense in depth:

1. **Server-side validation** as primary defense
2. **Edge Functions** for receipt verification
3. **Audit logging** for detection and investigation
4. **RLS policies** enforcing all business rules
5. **Connection isolation** for privacy
6. **Rate limiting** to prevent abuse

**Remember**: The client is never trusted. All security decisions happen on the server.
