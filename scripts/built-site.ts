import { Glob } from 'bun'

export const distDirectory = new URL('../dist/', import.meta.url).pathname

export async function builtHtmlPages(): Promise<{ path: string; html: string }[]> {
  const paths = await Array.fromAsync(new Glob('**/*.html').scan(distDirectory))
  if (paths.length === 0) throw new Error('No HTML in dist/. Run bun run build first.')
  return Promise.all(paths.sort().map(async (path) => ({ path, html: await Bun.file(distDirectory + path).text() })))
}
