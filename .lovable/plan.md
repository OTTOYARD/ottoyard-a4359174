

## Plan: Add Prominent "Acknowledge All" Button to Notifications Panel

The panel already has small icon buttons for "mark all read" and "clear all," but they're easy to miss when you have 200+ notifications. The fix is to add a visible, labeled button.

### Changes to `src/components/NotificationsPanel.tsx`

**Add a prominent "Acknowledge All" banner** between the header and the notification list when `unreadCount > 0`. This will be a full-width button styled with primary colors:

```
┌─ Notifications ──── [🔊] [✓] [🗑] ─┐
│                                      │
│  ┌──────────────────────────────┐    │
│  │ ✓  Acknowledge All (214)     │    │  ← NEW: full-width button
│  └──────────────────────────────┘    │
│                                      │
│  [notification cards...]             │
└──────────────────────────────────────┘
```

- Calls both `markAllAsRead()` and `clearNotifications()` in sequence to reset the counter to 0 and remove all cards
- Only visible when `unreadCount > 0`
- Styled as a compact, full-width button with a `Check` icon and the unread count

This is a single-file edit to `src/components/NotificationsPanel.tsx`, inserting ~10 lines between the header div (line 214) and the ScrollArea (line 217).

