import { describe, expect, test } from 'bun:test'
import { docsReadingOrder, parseDocsSidebar } from './sidebar'

const docsIndex = `# Spyria documentation

Start with the [overview](architecture/overview.md). The rules are in [AGENTS.md](../AGENTS.md).

## Architecture

- [Overview](architecture/overview.md): the system in one diagram.
- [Contexts and apps](architecture/contexts.md): what each package owns.

## Decisions

- [Decision records](decisions/README.md): one short record per decision.

## Guides

- [Testing](guides/testing.md): the test layers, \`bun test\` and fakes.
`

const decisionsIndex = `# Decision records

| # | Decision |
|---|---|
| [0001](0001-postgres-source-of-truth.md) | Postgres is the source of truth |
| [0021](0021-ci-on-github-actions-through-develop.md) | CI on GitHub Actions, with \`main\` fed from a tested \`develop\` |
`

describe('parseDocsSidebar', () => {
  const sections = parseDocsSidebar(docsIndex, decisionsIndex)

  test('keeps the sections and links of the docs index in order', () => {
    expect(sections.map(({ title }) => title)).toEqual(['Architecture', 'Decisions', 'Guides'])
    expect(sections[0]?.links).toEqual([
      { label: 'Overview', docsPath: 'architecture/overview.md' },
      { label: 'Contexts and apps', docsPath: 'architecture/contexts.md' },
    ])
  })

  test('lists the decision records after their index, in the order of its table', () => {
    expect(sections[1]?.links).toEqual([
      { label: 'Decision records', docsPath: 'decisions/README.md' },
      { label: '0001 Postgres is the source of truth', docsPath: 'decisions/0001-postgres-source-of-truth.md' },
      {
        label: '0021 CI on GitHub Actions, with main fed from a tested develop',
        docsPath: 'decisions/0021-ci-on-github-actions-through-develop.md',
      },
    ])
  })

  test('ignores links outside a section list', () => {
    const docsPaths = sections.flatMap(({ links }) => links.map(({ docsPath }) => docsPath))
    expect(docsPaths).not.toContain('../AGENTS.md')
  })

  test('reads from the docs index through every section', () => {
    expect(docsReadingOrder(sections).map(({ docsPath }) => docsPath)).toEqual([
      'README.md',
      'architecture/overview.md',
      'architecture/contexts.md',
      'decisions/README.md',
      'decisions/0001-postgres-source-of-truth.md',
      'decisions/0021-ci-on-github-actions-through-develop.md',
      'guides/testing.md',
    ])
  })
})
