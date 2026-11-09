import { renderMermaidSVG } from 'beautiful-mermaid'

class DiagramStyleError extends Error {}

export function renderDiagram(mermaidSource: string, idPrefix: string): string {
  const svg = renderMermaidSVG(mermaidSource, { transparent: true })
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/^(<svg\b[^>]*?)\s+style="[^"]*"/, '$1')
    .replace(/\bid="([^"]+)"/g, `id="${idPrefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${idPrefix}-$1)`)
    .replace(/\n\s*\n/g, '\n')
  if (/<style\b|\sstyle="/.test(svg)) throw new DiagramStyleError('A diagram kept an inline style the CSP would block')
  return `<figure class="diagram" tabindex="0">${svg}</figure>`
}
