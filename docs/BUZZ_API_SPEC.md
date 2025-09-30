# Buzz System API Specification

## Overview
The Buzz System allows users to send quick predefined or custom messages to their connected partner. Free users can only use 5 default templates, while premium users can create custom buzz messages up to 50 characters.

## Database Schema

### buzz_templates
```sql
CREATE TABLE buzz_templates (
  id VARCHAR(50) PRIMARY KEY,
  text VARCHAR(50) NOT NULL,
  type ENUM('default', 'custom') NOT NULL,
  owner_id VARCHAR(50) NULL, -- NULL for default templates
  emoji VARCHAR(10) DEFAULT '💫',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default templates (inserted during setup)
INSERT INTO buzz_templates (id, text, type, emoji) VALUES
('default_1', 'Thinking of you', 'default', '💭'),
('default_2', 'Miss you', 'default', '🥺'),
('default_3', 'Love you', 'default', '❤️'),
('default_4', 'Good morning', 'default', '🌅'),
('default_5', 'Good night', 'default', '🌙');
```

### buzz_history
```sql
CREATE TABLE buzz_history (
  id VARCHAR(50) PRIMARY KEY,
  buzz_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(50) NOT NULL,
  receiver_id VARCHAR(50) NOT NULL,
  connection_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  FOREIGN KEY (buzz_id) REFERENCES buzz_templates(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  FOREIGN KEY (connection_id) REFERENCES connections(id),
  
  INDEX idx_connection_created (connection_id, created_at),
  INDEX idx_receiver_read (receiver_id, read_at)
);
```

## API Endpoints

### 1. Get Buzz Templates
**GET** `/api/buzz/templates`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "default_1",
        "text": "Thinking of you",
        "type": "default",
        "emoji": "💭",
        "ownerId": null
      },
      {
        "id": "custom_123",
        "text": "Can't wait to see you!",
        "type": "custom", 
        "emoji": "😍",
        "ownerId": "user_456"
      }
    ],
    "canCreateCustom": true,
    "customCount": 5,
    "maxCustom": 20
  }
}
```

### 2. Create Custom Buzz Template
**POST** `/api/buzz/custom`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Can't wait to see you!",
  "emoji": "😍"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "custom_123",
      "text": "Can't wait to see you!",
      "type": "custom",
      "emoji": "😍",
      "ownerId": "user_456",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Response (Non-Premium):**
```json
{
  "success": false,
  "error": {
    "code": "PREMIUM_REQUIRED",
    "message": "Custom buzz messages require premium subscription"
  }
}
```

### 3. Send Buzz
**POST** `/api/buzz`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "buzzId": "default_1",
  "receiverId": "user_789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "buzzEvent": {
      "id": "buzz_event_123",
      "buzzId": "default_1",
      "senderId": "user_456",
      "receiverId": "user_789",
      "text": "Thinking of you",
      "emoji": "💭",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Response (Cooldown):**
```json
{
  "success": false,
  "error": {
    "code": "COOLDOWN_ACTIVE",
    "message": "Please wait 25s before sending another buzz",
    "remainingTime": 25000
  }
}
```

### 4. Get Buzz History
**GET** `/api/buzz/history?limit=50&offset=0`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "buzz_event_123",
        "buzzId": "default_1", 
        "senderId": "user_456",
        "receiverId": "user_789",
        "text": "Thinking of you",
        "emoji": "💭",
        "createdAt": "2024-01-15T10:30:00Z",
        "readAt": "2024-01-15T10:31:00Z"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

## WebSocket Events

### Send Buzz (Real-time)
**Event:** `buzz:send`
```json
{
  "buzzEventId": "buzz_event_123",
  "buzzId": "default_1",
  "senderId": "user_456", 
  "text": "Thinking of you",
  "emoji": "💭",
  "timestamp": 1705312200000
}
```

### Receive Buzz
**Event:** `buzz:receive`
```json
{
  "buzzEventId": "buzz_event_123",
  "buzzId": "default_1",
  "senderId": "user_456",
  "text": "Thinking of you", 
  "emoji": "💭",
  "timestamp": 1705312200000
}
```

### Buzz Read Receipt
**Event:** `buzz:read`
```json
{
  "buzzEventId": "buzz_event_123",
  "readAt": 1705312260000
}
```

## Business Logic

### Cooldown System
- **Duration:** 30 seconds between buzz sends
- **Scope:** Per user (not per template)
- **Storage:** Redis with TTL
- **Key:** `buzz_cooldown:{userId}`

### Premium Features
- **Free Users:** 5 default templates only
- **Premium Users:** 
  - All default templates
  - Up to 20 custom templates
  - 50 character limit per custom template
  - No cooldown restrictions (future feature)

### Rate Limiting
- **API Calls:** 100 requests per minute per user
- **Custom Template Creation:** 5 per day for premium users
- **Buzz Sending:** Governed by cooldown system

## Error Codes

| Code | Description |
|------|-------------|
| `PREMIUM_REQUIRED` | Feature requires premium subscription |
| `COOLDOWN_ACTIVE` | User must wait before sending another buzz |
| `TEMPLATE_NOT_FOUND` | Specified buzz template doesn't exist |
| `TEXT_TOO_LONG` | Custom buzz text exceeds 50 characters |
| `MAX_CUSTOM_REACHED` | User has reached maximum custom templates |
| `CONNECTION_REQUIRED` | Users must be connected to send buzz |
| `RATE_LIMIT_EXCEEDED` | Too many requests in time window |

## Implementation Notes

### Frontend (React Native)
- Store templates locally with AsyncStorage
- Implement optimistic UI updates
- Queue buzz sends when offline
- Show cooldown timer in real-time
- Handle premium upgrade prompts

### Backend (Node.js)
- Use Redis for cooldown tracking
- Implement WebSocket rooms per connection
- Queue offline buzz delivery
- Send push notifications for offline users
- Log all buzz events for analytics

### Database Optimization
- Index on `connection_id` and `created_at` for history queries
- Partition `buzz_history` by month for large datasets
- Use database triggers for `updated_at` timestamps
- Consider archiving old buzz history (>1 year)

This specification provides a complete foundation for implementing the Buzz System with proper scalability, premium features, and real-time functionality.