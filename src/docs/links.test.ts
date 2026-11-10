import { describe, expect, test } from 'bun:test'
import { rewriteDocsHref } from './links'

const productRef = '624b4e784cf38679d7b68336e47a8eb01eef79a2'
const productBlob = `https://github.com/Camil-H/spyria/blob/${productRef}`

function rewrite(href: string, fromDocsPath = 'guides/development.md', siteOrigin?: string) {
  return rewriteDocsHref(href, { fromDocsPath, productRef, docsPublished: true, ...(siteOrigin ? { siteOrigin } : {}) })
}

function rewriteWhileDocsUnpublished(href: string, fromDocsPath = 'guides/install.md') {
  return rewriteDocsHref(href, { fromDocsPath, productRef, docsPublished: false })
}

describe('rewriteDocsHref', () => {
  test.each([
    ['./testing.md', '/docs/guides/testing'],
    ['testing.md#fakes', '/docs/guides/testing#fakes'],
    ['./self-hosting.md#other-machines', '/docs/install/manual-install#other-machines'],
    ['../features/machines.md#removing-a-host', '/docs/install/machines#removing-a-host'],
    [
      '../decisions/0021-ci-on-github-actions-through-develop.md',
      '/docs/decisions/0021-ci-on-github-actions-through-develop',
    ],
    ['../decisions/', '/docs/decisions'],
    ['../decisions', '/docs/decisions'],
    ['../decisions/README.md', '/docs/decisions'],
    ['../README.md', '/docs'],
    ['../', '/docs'],
    ['../../AGENTS.md', `${productBlob}/AGENTS.md`],
    ['../../apps/server/src/index.ts#L10', `${productBlob}/apps/server/src/index.ts#L10`],
    ['../../.agents/skills/architecture/', `${productBlob}/.agents/skills/architecture/`],
    ['./diagram.svg', `${productBlob}/docs/guides/diagram.svg`],
  ])('from a guide, %s becomes %s', (href, expected) => {
    expect(rewrite(href)).toBe(expected)
  })

  test('links from the docs index resolve from the docs root', () => {
    expect(rewrite('guides/testing.md', 'README.md')).toBe('/docs/guides/testing')
    expect(rewrite('../AGENTS.md', 'README.md')).toBe(`${productBlob}/AGENTS.md`)
  })

  test.each(['https://stripe.dev/blog/minions', 'mailto:someone@example.com', '#quality-gates', '//example.com/page'])(
    'leaves %s unchanged',
    (href) => {
      expect(rewrite(href)).toBe(href)
    },
  )

  test('prefixes the site origin for Markdown twins', () => {
    expect(rewrite('./testing.md#fakes', 'guides/development.md', 'https://spyria.dev')).toBe(
      'https://spyria.dev/docs/guides/testing#fakes',
    )
  })

  test.each([
    ['./cloud.md', '/docs/install/cloud'],
    ['troubleshooting.md#the-setup-link', '/docs/install/troubleshooting#the-setup-link'],
    ['../features/admin.md#roles', '/docs/install/administration#roles'],
    ['../decisions/0001-postgres-source-of-truth.md', `${productBlob}/docs/decisions/0001-postgres-source-of-truth.md`],
    ['./testing.md#fakes', `${productBlob}/docs/guides/testing.md#fakes`],
    ['../decisions/', `${productBlob}/docs/decisions/README.md`],
    ['../', `${productBlob}/docs/README.md`],
  ])('while the docs are unpublished, from an install guide, %s becomes %s', (href, expected) => {
    expect(rewriteWhileDocsUnpublished(href)).toBe(expected)
  })

  test('refuses a link that leaves the product repository', () => {
    expect(() => rewrite('../../../elsewhere.md')).toThrow('leaves the product repository')
  })
})
