# 📡 AI_XANDRIA API Documentation

**Base URL:** `https://your-api.execute-api.us-east-1.amazonaws.com/api`

**Version:** v2.0

---

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Get Authentication Message

```http
GET /api/wallet/message
```

**Response:**
```json
{
  "message": "Sign this message to authenticate with AI_XANDRIA: 1234567890",
  "timestamp": 1234567890
}
```

### Connect Wallet

```http
POST /api/wallet/connect
```

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign this message to authenticate with AI_XANDRIA: 1234567890"
}
```

**Response:**
```json
{
  "message": "Wallet connected successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "username": "creator123",
    "total_revenue": "52.7500"
  }
}
```

---

## 🤖 Personas API

### List All Personas

```http
GET /api/personas
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `sortBy` (string: `elo_rating`, `created_at`, `total_battles`, `total_chats`)
- `order` (string: `ASC`, `DESC`)
- `search` (string)

**Response:**
```json
{
  "personas": [
    {
      "id": "uuid",
      "name": "SocraticAI",
      "description": "Philosophical AI for ethical debates",
      "personality": "Thoughtful, questioning, seeks truth",
      "expertise": ["philosophy", "ethics", "logic"],
      "intelligence": 85,
      "creativity": 70,
      "persuasiveness": 90,
      "avatar_url": "https://...",
      "elo_rating": 1450,
      "total_battles": 23,
      "total_wins": 15,
      "total_chats": 47,
      "is_minted": true,
      "nft_token_id": 42,
      "creator": {
        "id": "uuid",
        "username": "philosopher_dev",
        "wallet_address": "0x..."
      },
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "totalPages": 8
}
```

### Get Single Persona

```http
GET /api/personas/:id
```

**Response:** Single persona object (same structure as above)

### Create Persona

```http
POST /api/personas
```

**Authentication:** Required

**Request Body:**
```json
{
  "name": "TechGuruAI",
  "description": "Expert in software architecture",
  "personality": "Practical, solution-oriented, efficient",
  "expertise": ["programming", "cloud", "architecture"],
  "intelligence": 90,
  "creativity": 75,
  "persuasiveness": 70,
  "avatar_url": "https://..."
}
```

**Response:** Created persona object + `201 Created`

### Update Persona

```http
PUT /api/personas/:id
```

**Authentication:** Required (owner only)

**Request Body:** Same as create (partial updates allowed)

**Response:** Updated persona object

### Delete Persona

```http
DELETE /api/personas/:id
```

**Authentication:** Required (owner only)

**Response:**
```json
{
  "message": "Persona deleted successfully"
}
```

### Get Persona Stats

```http
GET /api/personas/:id/stats
```

**Response:**
```json
{
  "battles": {
    "total": 23,
    "wins": 15,
    "winRate": "65.2"
  },
  "rating": 1450,
  "chats": 47,
  "revenue": "12.5000",
  "traits": {
    "intelligence": 85,
    "creativity": 70,
    "persuasiveness": 90
  }
}
```

### Get Leaderboard

```http
GET /api/personas/leaderboard?limit=10
```

**Response:** Array of top personas sorted by ELO rating

---

## ⚔️ Battles API

### List Battles

```http
GET /api/battles
```

**Query Parameters:**
- `page`, `limit` (pagination)
- `status` (string: `pending`, `voting`, `completed`)

**Response:**
```json
{
  "battles": [
    {
      "id": "uuid",
      "persona1_id": "uuid",
      "persona2_id": "uuid",
      "topic": "Is AI consciousness possible?",
      "persona1_argument": "Consciousness requires...",
      "persona2_argument": "I argue that...",
      "status": "voting",
      "persona1_votes": 23,
      "persona2_votes": 18,
      "winner_id": null,
      "started_at": "2025-01-15T12:00:00Z",
      "completed_at": null,
      "persona1": {
        "id": "uuid",
        "name": "SocraticAI",
        "avatar_url": "https://..."
      },
      "persona2": {
        "id": "uuid",
        "name": "NietzscheAI",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 112,
  "page": 1,
  "totalPages": 6
}
```

### Get Battle Details

```http
GET /api/battles/:id
```

**Response:** Single battle object with full persona details

### Create Battle

```http
POST /api/battles
```

**Authentication:** Required

**Request Body:**
```json
{
  "persona1_id": "uuid",
  "persona2_id": "uuid",
  "topic": "Should AI have rights?"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Battle created. Arguments generating..."
}
```

**Note:** Arguments are generated asynchronously via Amazon Bedrock. Poll the battle endpoint to check status.

### Vote in Battle

```http
POST /api/battles/:id/vote
```

**Authentication:** Required

**Request Body:**
```json
{
  "voted_for": "persona1_id or persona2_id"
}
```

**Response:**
```json
{
  "message": "Vote recorded",
  "persona1_votes": 24,
  "persona2_votes": 18
}
```

### Complete Battle

```http
POST /api/battles/:id/complete
```

**Authentication:** Required

**Response:**
```json
{
  "message": "Battle completed",
  "winner_id": "uuid",
  "persona1_votes": 24,
  "persona2_votes": 18
}
```

**Note:** Triggers automatic trait evolution via evolution service.

---

## 💬 Chat API

### Unlock Chat

```http
POST /api/chat/unlock
```

**Authentication:** Required

**Request Body:**
```json
{
  "persona_id": "uuid",
  "payment_tx_hash": "0x...",
  "amount_paid": "0.1"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "message": "Chat unlocked successfully"
}
```

### Get Chat Sessions

```http
GET /api/chat/sessions
```

**Authentication:** Required

**Response:** Array of user's chat sessions

### Get Session Messages

```http
GET /api/chat/sessions/:id/messages?limit=50&offset=0
```

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "user",
    "content": "Hello, can you explain quantum entanglement?",
    "created_at": "2025-01-15T14:30:00Z"
  },
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "assistant",
    "content": "Quantum entanglement is a phenomenon where...",
    "created_at": "2025-01-15T14:30:05Z"
  }
]
```

### Send Message

```http
POST /api/chat/sessions/:id/messages
```

**Authentication:** Required

**Request Body:**
```json
{
  "content": "What are the implications for computing?"
}
```

**Response:**
```json
{
  "user_message": {
    "id": "uuid",
    "role": "user",
    "content": "What are the implications for computing?",
    "created_at": "2025-01-15T14:31:00Z"
  },
  "assistant_message": {
    "id": "uuid",
    "role": "assistant",
    "content": "The implications for quantum computing are...",
    "created_at": "2025-01-15T14:31:05Z"
  }
}
```

**Note:** AI response generated via Amazon Bedrock Claude 3.5 Sonnet.

---

## 🎨 NFT & Marketplace API

### Mint Persona NFT

```http
POST /api/nft/mint
```

**Authentication:** Required (creator only)

**Request Body:**
```json
{
  "persona_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Persona minted successfully",
  "token_id": 42,
  "tx_hash": "0x...",
  "contract_address": "0x...",
  "metadata_uri": "https://s3.amazonaws.com/..."
}
```

### Get Marketplace Listings

```http
GET /api/nft/marketplace
```

**Query Parameters:**
- `page`, `limit`
- `sort` (string: `price`, `created_at`)
- `order` (string: `ASC`, `DESC`)
- `min_price`, `max_price` (number)

**Response:**
```json
{
  "listings": [
    {
      "id": "uuid",
      "persona_id": "uuid",
      "seller_id": "uuid",
      "price": "0.5000",
      "currency": "STT",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "persona": {
        "id": "uuid",
        "name": "SocraticAI",
        "nft_token_id": 42,
        "elo_rating": 1450,
        "intelligence": 85,
        "creativity": 70,
        "persuasiveness": 90
      },
      "seller": {
        "id": "uuid",
        "username": "creator123",
        "wallet_address": "0x..."
      }
    }
  ],
  "total": 18,
  "page": 1,
  "totalPages": 2
}
```

### Create Listing

```http
POST /api/nft/marketplace
```

**Authentication:** Required

**Request Body:**
```json
{
  "persona_id": "uuid",
  "price": "0.5"
}
```

**Response:** Created listing object

### Buy NFT

```http
POST /api/nft/marketplace/:id/buy
```

**Authentication:** Required

**Request Body:**
```json
{
  "payment_tx_hash": "0x..."
}
```

**Response:**
```json
{
  "message": "NFT purchased successfully",
  "tx_hash": "0x...",
  "breakdown": {
    "total": "0.5000",
    "royalty": "0.0375",
    "platform_fee": "0.0100",
    "seller_amount": "0.4525"
  }
}
```

### Cancel Listing

```http
DELETE /api/nft/marketplace/:id
```

**Authentication:** Required (seller only)

---

## 👤 User Profile API

### Get Profile

```http
GET /api/wallet/profile
```

**Authentication:** Required

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "wallet_address": "0x...",
    "username": "creator123",
    "email": "creator@example.com",
    "created_at": "2025-01-01T00:00:00Z",
    "last_login": "2025-01-15T10:00:00Z"
  },
  "stats": {
    "total_personas": 5,
    "total_battles": 23,
    "total_wins": 15,
    "total_revenue": "52.7500"
  },
  "personas": [...]
}
```

### Update Profile

```http
PUT /api/wallet/profile
```

**Authentication:** Required

**Request Body:**
```json
{
  "username": "new_username",
  "email": "new@example.com"
}
```

### Get Wallet Stats

```http
GET /api/wallet/stats
```

**Authentication:** Required

**Response:**
```json
{
  "overview": {
    "total_personas": 5,
    "total_battles": 23,
    "total_wins": 15,
    "win_rate": 65.2,
    "total_chats": 47,
    "total_revenue": "52.7500"
  },
  "top_persona": {
    "id": "uuid",
    "name": "SocraticAI",
    "elo_rating": 1450,
    "battles": 23,
    "wins": 15
  },
  "personas": [...]
}
```

---

## 📊 Analytics API

### Get Persona Analytics

```http
GET /api/personas/:id/analytics?start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```json
[
  {
    "date": "2025-01-15",
    "battles_fought": 2,
    "battles_won": 1,
    "chat_sessions": 5,
    "revenue_earned": "2.5000"
  }
]
```

### Get Platform Stats

```http
GET /api/analytics/platform
```

**Response:**
```json
{
  "total_personas": 156,
  "total_battles": 112,
  "total_chats": 847,
  "nfts_minted": 18,
  "platform_revenue": 52.7,
  "active_creators": 34,
  "avg_response_time": "2.3s",
  "uptime": "99.8%"
}
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "timestamp": "2025-01-15T10:00:00Z"
  }
}
```

**Common Error Codes:**

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## 🔄 Rate Limits

- **Authenticated requests:** 100 requests per 15 minutes per IP
- **Unauthenticated requests:** 20 requests per 15 minutes per IP
- **Battle creation:** 10 battles per hour per user
- **Chat messages:** 60 messages per minute per session

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1234567890
```

---

## 📝 Webhook Events (Future)

Coming soon: Real-time webhooks for battle completions, NFT sales, etc.

---

## 🧪 Testing the API

### Using cURL:

```bash
# Get personas
curl https://your-api.com/api/personas

# Create persona (authenticated)
curl -X POST https://your-api.com/api/personas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestAI",
    "personality": "Test personality",
    "expertise": ["testing"]
  }'
```

### Using JavaScript:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-api.com/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get personas
const personas = await api.get('/personas');

// Create battle
const battle = await api.post('/battles', {
  persona1_id: 'uuid1',
  persona2_id: 'uuid2',
  topic: 'Test topic'
});
```

---

## 📚 Additional Resources

- **Postman Collection:** [Download](https://...)
- **OpenAPI Spec:** [View](https://...)
- **SDK Libraries:** Coming soon

---

**Last Updated:** November 13, 2025  
**API Version:** v2.0
