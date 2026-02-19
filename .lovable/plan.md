

# Fix OttoCommand EV Mode Authentication Error

## Problem

The edge function at `supabase/functions/ottocommand-ai-chat/index.ts` sends the Anthropic API key using the wrong header format:

```
"Authorization": `Bearer ${claudeApiKey}`
```

Anthropic's API requires:

```
"x-api-key": claudeApiKey
```

This causes a **401 authentication_error / "Invalid bearer token"** every time the EV concierge mode is activated.

## Fix

### File: `supabase/functions/ottocommand-ai-chat/index.ts`

Change the Claude API request headers (line ~232) from:

```typescript
headers: {
  "Authorization": `Bearer ${claudeApiKey}`,
  "Content-Type": "application/json",
  "anthropic-version": "2023-06-01",
},
```

To:

```typescript
headers: {
  "x-api-key": claudeApiKey,
  "Content-Type": "application/json",
  "anthropic-version": "2023-06-01",
},
```

This is the only change needed. After deploying, the EV mode tool calls (vehicle status, amenity booking, service scheduling, etc.) should all work correctly.

