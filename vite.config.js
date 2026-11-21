import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function htmlPartialsPlugin() {
  const includePattern = /<!--\s*@include\s+([^\s]+?)\s*-->/g;

  function resolveIncludes(html, fromFile, stack = new Set()) {
    return html.replace(includePattern, (_match, relPath) => {
      const targetPath = path.resolve(__dirname, relPath);
      if (stack.has(targetPath)) {
        throw new Error(`Circular HTML partial include detected: ${relPath}`);
      }
      if (!fs.existsSync(targetPath)) {
        throw new Error(`HTML partial not found: ${relPath} (referenced from ${fromFile})`);
      }
      const nextStack = new Set(stack);
      nextStack.add(targetPath);
      const partialContent = fs.readFileSync(targetPath, 'utf8');
      return resolveIncludes(partialContent, targetPath, nextStack);
    });
  }

  return {
    name: 'math-html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return resolveIncludes(html, path.resolve(__dirname, 'index.html'));
      },
    },
    handleHotUpdate({ file, server }) {
      const partialsDir = path.resolve(__dirname, 'partials');
      if (file.startsWith(partialsDir) && file.endsWith('.html')) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  // 使用相對路徑，確保根網域與 GitHub Pages 子路徑（如 /math-learning/）部署皆可正常載入
  base: './',
  plugins: [htmlPartialsPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide')) return 'vendor-lucide';
          if (id.includes('node_modules/gsap')) return 'vendor-gsap';
          if (id.includes('node_modules/')) return 'vendor-misc';
        },
      },
    },
  },
});
