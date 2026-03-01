# Design: Version Number and Last Updated Date on HomeScreen

## Goal

Display a version number and last-updated date on the quiz landing page so users can tell what build they're running.

## Decisions

- **Version source:** `package.json` `version` field, injected at build time
- **Last updated:** Build date (ISO date string, e.g. `2026-03-01`), injected at build time
- **Display format:** Small muted text, e.g. `v0.1.0 · Updated 2026-03-01`

## Implementation

### Vite build-time injection

Add a `define` block to `vite.config.ts` that reads `package.json` at build time:

```ts
define: {
  __APP_VERSION__: JSON.stringify(pkg.version),
  __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
}
```

### TypeScript globals

Declare the two constants in `src/vite-env.d.ts` (or a new `src/globals.d.ts`):

```ts
declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string
```

### HomeScreen UI

Add a single `<p>` at the bottom of the HomeScreen `div`, styled muted/small:

```tsx
<p style={{ fontSize: 'var(--font-size-sm, 12px)', opacity: 0.4, margin: 0 }}>
  v{__APP_VERSION__} · Updated {__BUILD_DATE__}
</p>
```

## Files Changed

- `vite.config.ts` — add `define` block, import `package.json`
- `src/vite-env.d.ts` — add global declarations
- `src/components/HomeScreen.tsx` — add version line

## Testing

No new unit tests. Build-time constants can't be meaningfully unit-tested. Verified by running `npm run build` and checking the output, and visually confirming on `npm run dev`.
