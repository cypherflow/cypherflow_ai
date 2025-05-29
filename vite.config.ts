// vite.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['src/test/**/*', 'src/**/*.test.ts', 'src/**/*.spec.ts']
		}
	},
	resolve: {
		alias: {
			$lib: './src/lib',
			$test: './src/test',
			path: 'path-browserify',
			'sanitize-html': 'dompurify'
		}
	},
  server: {
    allowedHosts: ['916f69fb22c7.ngrok.app', 'a83b949a4946.ngrok.app']
  },
	optimizeDeps: {
		include: ['path-browserify']
	}
});
