

# Fix Mobile Overflow Issues

## Problems Identified

1. **AppHeader (shared)** - The header has a left section (logo, interface toggle, weather button) and a right section (3 rows: notifications/settings, OttoCommand button, status badge) that together overflow on screens narrower than ~400px.

2. **OrchestraEV Tab Bar** - Uses `grid grid-cols-6` which forces 6 equal columns on all screen sizes, causing text to be clipped or overflow on mobile.

3. **Fleet Command Tab Bar** - 5 horizontal tabs can also get cramped on very small screens.

4. **Map container** - Mapbox controls can overflow the viewport edges on mobile (noted from session replay context).

---

## Changes

### 1. AppHeader (`src/components/shared/AppHeader.tsx`)
- Add `overflow-hidden` to the outer container to prevent bleed
- On mobile (below `sm`), stack the header vertically: logo row on top, action buttons below
- Shrink/hide the weather button text on very small screens
- Collapse the right-side 3 rows into a single compact row on mobile

### 2. OrchestraEV Tabs (`src/pages/OrchestraEV.tsx`)
- Change from `grid grid-cols-6` to a horizontally scrollable tab list on mobile using `flex overflow-x-auto` with `grid-cols-6` only on `md+` screens
- Add `whitespace-nowrap` to tab triggers so text doesn't wrap

### 3. Fleet Command Tabs (`src/pages/Index.tsx`)
- Add `overflow-x-auto` to the tab list wrapper so tabs scroll horizontally on small screens instead of wrapping or overflowing

### 4. Global CSS (`src/App.css`)
- Add `overflow-x: hidden` on the root/body level to prevent any horizontal scroll from leaking elements

### 5. Map Controls (`src/App.css`)
- Ensure mapbox control groups respect viewport boundaries with `max-width` and proper positioning

---

## Technical Details

**AppHeader mobile layout change:**
```tsx
// Outer wrapper gets overflow-hidden
<div className="px-3 pt-3 pb-2 overflow-hidden">
  <div className="glass-panel rounded-xl border border-border/50 px-3 py-2 overflow-hidden">
    {/* flex-wrap so items can stack on narrow screens */}
    <div className="flex items-center justify-between gap-2 min-w-0">
      {/* Left side: add min-w-0 + truncate to prevent overflow */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        ...
      </div>
      {/* Right side: shrink flex items */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        ...
      </div>
    </div>
  </div>
</div>
```

**OrchestraEV tabs change:**
```tsx
// From:
<TabsList className="grid grid-cols-6 w-full max-w-2xl">

// To:
<TabsList className="flex overflow-x-auto md:grid md:grid-cols-6 w-full max-w-2xl">
```

**Global overflow prevention:**
```css
html, body, #root {
  overflow-x: hidden;
  max-width: 100vw;
}
```

This ensures nothing bleeds past the viewport edge on any mobile device while keeping the desktop layout unchanged.
