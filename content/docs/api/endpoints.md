---
title: "API Endpoints"
description: "Complete reference for all AskYourSite API endpoints."
---

# API Endpoints

Complete reference for all available API endpoints. All requests require an `Authorization: Bearer YOUR_API_KEY` header.

---

## Chat

### POST /api/chat

Send a message to an assistant and receive an AI-generated response.

**Request Body:**

```json
{
  "assistantId": "string (required)",
  "message": "string (required)",
  "sessionId": "string (optional — used to group messages into a conversation)"
}
```

**Response:**

```json
{
  "answer": "Our return policy allows returns within 30 days of purchase...",
  "sources": ["https://yoursite.com/returns"]
}
```

**Example:**

```bash
curl -X POST https://askyoursite.in/api/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "asst_abc123",
    "message": "What is your refund policy?",
    "sessionId": "user_xyz"
  }'
```

**Rate limit:** 10 requests / minute per IP.

---

## Widget Configuration

### GET /api/widget/[assistantId]

Returns the public configuration for a widget (used by the embed script). No authentication required.

**Response:**

```json
{
  "assistantId": "asst_abc123",
  "name": "Support Bot",
  "welcomeMessage": "Hi! How can I help you today?",
  "primaryColor": "#3b82f6",
  "logoUrl": "https://askyoursite.in/...",
  "leadCaptureEnabled": false
}
```

---

## Assistants

### GET /api/assistants

Returns all assistants belonging to the authenticated user.

**Response:**

```json
{
  "assistants": [
    {
      "id": "asst_abc123",
      "name": "Support Bot",
      "status": "ready",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## Leads

### GET /api/leads

Returns all captured leads for the authenticated user's assistants.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `assistantId` | string | Filter leads by assistant |
| `limit` | number | Max results (default 50, max 200) |
| `offset` | number | Pagination offset |

**Response:**

```json
{
  "leads": [
    {
      "id": "lead_123",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "assistantId": "asst_abc123",
      "capturedAt": "2026-04-06T10:30:00Z"
    }
  ],
  "total": 42
}
```

---

## Webhooks

### POST /api/webhooks

Receives incoming webhook events from integrations (Zapier, Slack, Calendly). This endpoint is called by third-party services — not by your application directly.

---

## Error Reference

| Error Code | HTTP Status | Description |
|------------|------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Assistant or resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INVALID_INPUT` | 400 | Missing or malformed request body |
| `INTERNAL_ERROR` | 500 | Contact support |
