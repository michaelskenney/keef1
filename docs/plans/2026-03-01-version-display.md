# Version Display on HomeScreen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show `v<version> · Updated <build-date>` on the quiz landing page, injected at build time.

**Architecture:** Vite's `define` config reads `package.json` version and generates a build-date string at compile time, exposing them as `__APP_VERSION__` and `__BUILD_DATE__` global constants. A `declare const` file makes TypeScript happy. HomeScreen renders them as a small muted `<p>` tag.

**Tech Stack:** TypeScript, React, Vite (`define` config), `package.json`

---

### Task 1: Inject version constants and display on HomeScreen

**Files:**
- Modify: `vite.config.ts`
- Create: `src/globals.d.ts`
- Modify: `src/components/HomeScreen.tsx`

**Background:** Vite's `define` config replaces literal occurrences of named constants in your source at build time (like a find-and-replace before compilation). `__APP_VERSION__` and `__BUILD_DATE__` will be replaced with their string values in the final bundle. Without the `declare const` file TypeScript will error with "Cannot find name '__APP_VERSION__'".

**Step 1: Update `vite.config.ts`**

Replace the full contents of `vite.config.ts` with:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

**Step 2: Create `src/globals.d.ts`**

```typescript
declare const __APP_VERSION__: string
declare const __BUILD_DATE__: string
```

**Step 3: Update `src/components/HomeScreen.tsx`**

Add one line at the bottom of the returned `div`, after the button group `div`:

```tsx
      <p style={{ fontSize: 12, opacity: 0.4, margin: 0 }}>
        v{__APP_VERSION__} · Updated {__BUILD_DATE__}
      </p>
```

The full `return` block should look like:

```tsx
  return (
    <div className="screen" style={{ justifyContent: 'center', gap: 32 }}>
      <div>
        <h1 className="app-title">THE<br /><span>ROLLING</span><br />STONES<br />QUIZ</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Your nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePlay()}
          maxLength={30}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
        />
        <button className="btn-primary" onClick={handlePlay}>
          Play
        </button>
        <button className="btn-secondary" onClick={onLeaderboard}>
          Leaderboard
        </button>
      </div>
      <p style={{ fontSize: 12, opacity: 0.4, margin: 0 }}>
        v{__APP_VERSION__} · Updated {__BUILD_DATE__}
      </p>
    </div>
  )
```

**Step 4: Run the build to verify TypeScript is happy**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

**Step 5: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (the new `<p>` doesn't break any existing tests).

**Step 6: Commit**

```bash
git add vite.config.ts src/globals.d.ts src/components/HomeScreen.tsx
git commit -m "feat: show version and build date on HomeScreen"
```
