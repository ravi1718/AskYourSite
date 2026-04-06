---
title: "API Overview"
description: "Use the AskYourSite API to integrate AI chat into your own applications."
---

# API Overview

The AskYourSite API lets you embed AI-powered chat into your own applications, query your assistant programmatically, and build custom integrations.

## Base URL

All API requests are made to:

```
https://askyoursite.in/api
```

## Authentication

All API requests require authentication. See [Authentication](/docs/api/authentication) for details.

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/chat` | 10 requests / minute per IP |
| All other endpoints | 60 requests / minute per API key |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1712401800
```

When you exceed the rate limit, the API returns `429 Too Many Requests`.

---

## Response Format

All API responses are JSON. Successful responses follow this structure:

```json
{
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request — check your request body |
| `401` | Unauthorized — invalid or missing API key |
| `404` | Not found — assistant or resource doesn't exist |
| `429` | Rate limit exceeded |
| `500` | Internal server error — contact support |

---

## Available Endpoints

See [Endpoints](/docs/api/endpoints) for a full reference of all available API calls.

---

## Need Help?

If you run into issues, email **ravitej@askyoursite.in** with:
- The endpoint you're calling
- Your request body (redact the API key)
- The response you received
