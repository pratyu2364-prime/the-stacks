import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/the-stacks/',
  plugins: [react()],
  test: { environment: 'node', include: ['src/**/*.test.ts'], passWithNoTests: true },
});
