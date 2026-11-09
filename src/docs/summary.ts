const descriptionLimit = 155

export function summaryOf(markdown: string): string {
  const paragraph =
    markdown
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|\||```|[-*>]|\d+\.|<)/.test(block)) ?? ''
  const text = paragraph
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= descriptionLimit) return text
  const cut = text.slice(0, descriptionLimit - 1)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}
