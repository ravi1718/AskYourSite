---
title: "API Authentication"
description: "How to authenticate requests to the AskYourSite API."
---

# API Authentication

AskYourSite uses **API keys** to authenticate requests. Include your API key in the `Authorization` header of every request.

## Getting Your API Key

1. Go to **Dashboard → Settings → API**
2. Click **Generate API Key**
3. Copy the key — it will only be shown once

> **Warning:** Treat your API key like a password. Do not expose it in client-side code, public repositories, or browser JavaScript. Use it only in server-side code.

---

## Using Your API Key

Include the key in the `Authorization` header with the `Bearer` prefix:

```bash
curl https://askyoursite.in/api/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "assistantId": "YOUR_AGENT_ID", "message": "What is your return policy?" }'
```

---

## Example: Node.js

```javascript
const response = await fetch("https://askyoursite.in/api/chat", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.AYS_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    assistantId: "YOUR_AGENT_ID",
    message: "What are your business hours?",
    sessionId: "user-session-123",
  }),
});

const { answer } = await response.json();
console.log(answer);
```

---

## Example: Python

```python
import requests
import os

response = requests.post(
    "https://askyoursite.in/api/chat",
    headers={
        "Authorization": f"Bearer {os.environ['AYS_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "assistantId": "YOUR_AGENT_ID",
        "message": "How do I reset my password?",
        "sessionId": "user-session-456",
    },
)

data = response.json()
print(data["answer"])
```

---

## Error Responses

If authentication fails, you'll receive:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

Common causes:
- Missing `Authorization` header
- `Bearer` prefix omitted
- Key was deleted or regenerated

---

## Rotating Your API Key

Go to **Dashboard → Settings → API → Regenerate Key**. Your old key is immediately invalidated. Update all services using the old key before regenerating.

---

## Security Best Practices

- Store API keys in environment variables, never hardcoded
- Use separate keys for dev and production environments
- Rotate keys periodically or after any suspected exposure
- Never expose keys in client-side JavaScript or mobile app code
