import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import pkg from './package.json'

const recentChanges = execSync('git log -5 --format="%ad|%s" --date=short', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .map(line => {
    const [date, ...rest] = line.split('|')
    return { date, message: rest.join('|') }
  })

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
    __RECENT_CHANGES__: JSON.stringify(recentChanges),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
