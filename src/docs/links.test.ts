import { describe, expect, test } from 'bun:test'
import { rewriteDocsHref } from './links'

const productRef = '624b4e784cf38679d7b68336e47a8eb01eef79a2'
const productBlob = `https://github.com/Camil-H/spyria/blob/${productRef}`

function rewrite(href: string, fromDocsPath = 'guides/install.md', siteOrigin?: string) {
  return rewriteDocsHref(href, { fromDocsPath, productRef, ...(siteOrigin ? { siteOrigin } : {}) })
}

describe('rewriteDocsHref', () => {
  test.each([
    ['./cloud-aws.md', '/docs/install/aws'],
    ['troubleshooting.md#the-setup-link', '/docs/install/troubleshooting#the-setup-link'],
    ['./self-hosting.md#other-machines', '/docs/install/manual-install#other-machines'],
  ])('from an install guide, the install guide %s becomes the site page %s', (href, expected) => {
    expect(rewrite(href)).toBe(expected)
  })

  test.each([
    ['../features/machines.md#removing-a-host', '/docs/machines#removing-a-host'],
    ['../features/admin.md#roles', '/docs/administration#roles'],
    ['./who-can-join.md', '/docs/who-can-join'],
  ])('from an install guide, the Using Spyria page %s becomes the site page %s', (href, expected) => {
    expect(rewrite(href)).toBe(expected)
  })

  test('a link to the one-machine guide goes to its page under the install overview', () => {
    expect(rewrite('../guides/install.md#prerequisites', 'features/machines.md')).toBe(
      '/docs/install/one-machine#prerequisites',
    )
  })

  test.each([
    ['../decisions/0001-postgres-source-of-truth.md', `${productBlob}/docs/decisions/0001-postgres-source-of-truth.md`],
    ['./testing.md#fakes', `${productBlob}/docs/guides/testing.md#fakes`],
    ['../architecture/overview.md#runtimes', `${productBlob}/docs/architecture/overview.md#runtimes`],
    ['../decisions/', `${productBlob}/docs/decisions/README.md`],
    ['../decisions', `${productBlob}/docs/decisions/README.md`],
    ['../', `${productBlob}/docs/README.md`],
    ['../../AGENTS.md', `${productBlob}/AGENTS.md`],
    ['../../apps/server/src/index.ts#L10', `${productBlob}/apps/server/src/index.ts#L10`],
    ['../../.agents/skills/architecture/', `${productBlob}/.agents/skills/architecture/`],
    ['./diagram.svg', `${productBlob}/docs/guides/diagram.svg`],
  ])('from an install guide, %s, which the site does not publish, becomes %s on GitHub', (href, expected) => {
    expect(rewrite(href)).toBe(expected)
  })

  test('links from the docs index resolve from the docs root', () => {
    expect(rewrite('guides/cloud-aws.md', 'README.md')).toBe('/docs/install/aws')
    expect(rewrite('../AGENTS.md', 'README.md')).toBe(`${productBlob}/AGENTS.md`)
  })

  test.each(['https://stripe.dev/blog/minions', 'mailto:someone@example.com', '#quality-gates', '//example.com/page'])(
    'leaves %s unchanged',
    (href) => {
      expect(rewrite(href)).toBe(href)
    },
  )

  test('prefixes the site origin for Markdown twins', () => {
    expect(rewrite('./cloud-aws.md#modules', 'guides/install.md', 'https://spyria.dev')).toBe(
      'https://spyria.dev/docs/install/aws#modules',
    )
  })

  test('refuses a link that leaves the product repository', () => {
    expect(() => rewrite('../../../elsewhere.md')).toThrow('leaves the product repository')
  })
})
