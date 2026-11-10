import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HastPluginDefinition, MdastPluginEntry, PluginFactoryContext } from 'satteri'
import type { ShikiTransformer } from 'shiki'
import { docsPublished } from '../site'
import { renderDiagram } from './diagrams'
import { rewriteDocsHref } from './links'
import { productDocsDirectory } from './product'

class CodeStyleError extends Error {}

export function docsLinksPlugin(productRef: string): MdastPluginEntry {
  return ({ fileURL }: PluginFactoryContext) => {
    const fromDocsPath = fileURL && relative(productDocsDirectory, fileURLToPath(fileURL))
    if (!fromDocsPath || fromDocsPath.startsWith('..')) return null
    const rewrite = (url: string) => rewriteDocsHref(url, { fromDocsPath, productRef, docsPublished })
    return {
      name: 'docs-links',
      link(node, ctx) {
        ctx.setField(node, 'url', rewrite(node.url))
      },
      definition(node, ctx) {
        ctx.setField(node, 'url', rewrite(node.url))
      },
    }
  }
}

export const mermaidDiagramsPlugin: MdastPluginEntry = () => {
  let diagramCount = 0
  return {
    name: 'mermaid-diagrams',
    code(node) {
      if (node.lang !== 'mermaid') return
      diagramCount += 1
      return { type: 'html', value: renderDiagram(node.value, `diagram-${diagramCount}`) }
    },
  }
}

export const scrollableTablesPlugin: HastPluginDefinition = {
  name: 'scrollable-tables',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0 },
        children: [],
      })
    },
  },
}

export const alignedCellsPlugin: HastPluginDefinition = {
  name: 'aligned-cells',
  element: {
    filter: ['th', 'td'],
    visit(node, ctx) {
      const alignment = String(node.properties?.style ?? '').match(/text-align:\s*(left|center|right)/)?.[1]
      if (!alignment) return
      ctx.setProperty(node, 'style', null)
      ctx.setProperty(node, 'className', [`align-${alignment}`])
    },
  },
}

const codeClassByDeclaration: Record<string, string> = {
  'font-style:italic': 'code-italic',
  'font-weight:bold': 'code-bold',
  'text-decoration:underline': 'code-underline',
}

export const classBasedCodeColors: ShikiTransformer = {
  name: 'class-based-code-colors',
  pre(node) {
    delete node.properties.style
  },
  span(node) {
    const style = node.properties.style
    if (typeof style !== 'string') return
    delete node.properties.style
    for (const declaration of style.split(';')) {
      const compact = declaration.replace(/\s+/g, '')
      if (compact) this.addClassToHast(node, codeClassOf(compact))
    }
  },
}

function codeClassOf(declaration: string): string {
  const colorVariable = declaration.match(/^color:var\(--astro-code-([\w-]+)\)$/)?.[1]
  const codeClass = colorVariable ? `code-${colorVariable}` : codeClassByDeclaration[declaration]
  if (!codeClass) throw new CodeStyleError(`Code highlighting made an inline style the CSP would block: ${declaration}`)
  return codeClass
}
