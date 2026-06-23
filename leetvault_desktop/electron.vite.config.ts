import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const POSTHOG_KEY = env.POSTHOG_KEY ?? process.env.POSTHOG_KEY ?? '';
  const POSTHOG_HOST = env.POSTHOG_HOST ?? process.env.POSTHOG_HOST ?? '';

  const mainDefine = {
    __POSTHOG_KEY__: JSON.stringify(POSTHOG_KEY),
    __POSTHOG_HOST__: JSON.stringify(POSTHOG_HOST),
    __APP_VERSION__: JSON.stringify(pkg.version),
  } as const;

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      resolve: {
        alias: {
          '@main': resolve('src/main'),
          '@shared': resolve('src/shared'),
        },
      },
      define: mainDefine,
      build: {
        outDir: 'out/main',
        rollupOptions: {
          input: resolve('src/main/index.ts'),
        },
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      resolve: {
        alias: {
          '@shared': resolve('src/shared'),
        },
      },
      build: {
        outDir: 'out/preload',
        rollupOptions: {
          input: resolve('src/preload/index.ts'),
        },
      },
    },
    renderer: {
      root: resolve('src/renderer'),
      plugins: [react()],
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer'),
          '@shared': resolve('src/shared'),
        },
      },
      define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
      },
      build: {
        outDir: resolve('out/renderer'),
        emptyOutDir: true,
        rollupOptions: {
          input: resolve('src/renderer/index.html'),
        },
      },
      server: {
        port: 5173,
      },
    },
  };
});
