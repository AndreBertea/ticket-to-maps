import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, Plugin } from 'vite';

// Minimal plugin to serve/copy src/sw.js as /sw.js at root
function serviceWorkerPlugin(): Plugin {
  const srcPath = resolve(__dirname, 'src', 'sw.js');
  return {
    name: 'sw-copy-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/sw.js') {
          try {
            const code = readFileSync(srcPath, 'utf-8');
            res.setHeader('Content-Type', 'text/javascript');
            res.end(code);
            return;
          } catch (e) {
            // Fallthrough
          }
        }
        next();
      });
    },
    generateBundle() {
      try {
        const code = readFileSync(srcPath, 'utf-8');
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: code });
      } catch (e) {
        // ignore if missing
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [serviceWorkerPlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.1.0'),
    },
    resolve: {
      alias: {
        '@utils': resolve(__dirname, 'src', 'utils'),
        '@components': resolve(__dirname, 'src', 'components'),
      },
    },
    server: {
      port: 5173,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      target: 'es2020',
    },
    publicDir: 'public',
  };
});

declare global {
  // Expose app version constant
  // eslint-disable-next-line no-var
  var __APP_VERSION__: string;
}
