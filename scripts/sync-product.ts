import { existsSync, rmSync } from 'node:fs'
import { productRepositoryUrl } from '../src/site'

const rootDirectory = new URL('../', import.meta.url).pathname
const productDirectory = `${rootDirectory}.product`
const datesFile = `${productDirectory}/docs-dates.json`
const productRef = (await Bun.file(`${rootDirectory}product.ref`).text()).trim()

class ProductSyncError extends Error {}

try {
  await syncProduct(productRef)
} catch (error) {
  if (!(error instanceof ProductSyncError)) throw error
  console.error(`Product docs: ${error.message}`)
  process.exit(1)
}

async function syncProduct(ref: string) {
  if (!/^[0-9a-f]{40}$/.test(ref)) throw new ProductSyncError(`product.ref must hold a full commit SHA, found "${ref}"`)
  if (await isSyncedTo(ref)) {
    console.log(`Product docs: already at ${ref.slice(0, 7)}.`)
    return
  }
  const startedAt = performance.now()
  rmSync(productDirectory, { recursive: true, force: true })
  await checkOutProduct(ref, await productRepositoryToken())
  await writeDocsDates()
  console.log(`Product docs: synced to ${ref.slice(0, 7)} in ${Math.round(performance.now() - startedAt)} ms.`)
}

async function isSyncedTo(ref: string): Promise<boolean> {
  if (!existsSync(`${productDirectory}/.git`) || !existsSync(datesFile)) return false
  const head = await git(['rev-parse', 'HEAD'], { allowFailure: true })
  const changes = await git(['status', '--porcelain', '--untracked-files=no'], { allowFailure: true })
  return head === ref && changes === ''
}

async function checkOutProduct(ref: string, token: string | undefined) {
  await git(['init', '--quiet', productDirectory], { cwd: rootDirectory })
  await git(['remote', 'add', 'origin', `${productRepositoryUrl}.git`])
  await git(['sparse-checkout', 'set', '--no-cone', '/docs/', '/install.sh'])
  const authorization = token ? authorizationConfig(token) : {}
  try {
    await git(['fetch', '--quiet', '--filter=blob:none', '--no-tags', 'origin', ref], { env: authorization })
    await git(['checkout', '--quiet', 'FETCH_HEAD'], { env: authorization })
  } catch (error) {
    rmSync(productDirectory, { recursive: true, force: true })
    const hint = token
      ? 'Check that PRODUCT_REPO_TOKEN can read the repository and that the commit exists.'
      : 'The repository is private until launch: set PRODUCT_REPO_TOKEN, or sign in with the GitHub CLI.'
    throw new ProductSyncError(
      `Could not fetch ${productRepositoryUrl} at ${ref}. ${hint}\n${(error as Error).message}`,
    )
  }
}

async function writeDocsDates() {
  const docsFiles = (await git(['ls-tree', '-r', '--name-only', 'HEAD', 'docs'])).split('\n').filter(Boolean)
  const entries = await Promise.all(
    docsFiles.map(async (file) => [
      file.slice('docs/'.length),
      await git(['log', '-1', '--format=%cI', 'HEAD', '--', file]),
    ]),
  )
  await Bun.write(datesFile, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`)
}

async function productRepositoryToken(): Promise<string | undefined> {
  if (process.env.PRODUCT_REPO_TOKEN) return process.env.PRODUCT_REPO_TOKEN
  if (process.env.CI || !Bun.which('gh')) return undefined
  const result = Bun.spawnSync(['gh', 'auth', 'token'], { stderr: 'ignore' })
  const token = result.stdout.toString().trim()
  return result.exitCode === 0 && token ? token : undefined
}

function authorizationConfig(token: string): Record<string, string> {
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.extraHeader',
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${btoa(`x-access-token:${token}`)}`,
  }
}

async function git(
  args: string[],
  {
    cwd = productDirectory,
    env = {},
    allowFailure = false,
  }: { cwd?: string; env?: Record<string, string>; allowFailure?: boolean } = {},
): Promise<string> {
  const child = Bun.spawn(['git', ...args], {
    cwd,
    env: { ...process.env, ...env, GIT_TERMINAL_PROMPT: '0' },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  if (exitCode !== 0 && !allowFailure) {
    throw new ProductSyncError(`git ${args[0]} failed: ${stderr.trim()}`)
  }
  return exitCode === 0 ? stdout.trim() : ''
}
