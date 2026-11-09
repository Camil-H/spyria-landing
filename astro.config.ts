import { satteri } from '@astrojs/markdown-satteri'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import {
  alignedCellsPlugin,
  classBasedCodeColors,
  docsLinksPlugin,
  mermaidDiagramsPlugin,
  scrollableTablesPlugin,
} from './src/docs/markdown'
import { readProductRef } from './src/docs/product'

export default defineConfig({
  site: 'https://spyria.dev',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  markdown: {
    processor: satteri({
      mdastPlugins: [docsLinksPlugin(readProductRef()), mermaidDiagramsPlugin],
      hastPlugins: [scrollableTablesPlugin, alignedCellsPlugin],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: { theme: 'css-variables', wrap: null, transformers: [classBasedCodeColors] },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
