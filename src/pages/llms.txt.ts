import type { APIRoute } from 'astro'
import { docsRouteOf } from '../docs/routes'
import { loadDocsSidebar } from '../docs/sidebar-data'
import { docsPublished, productRepositoryUrl } from '../site'

const summary =
  'Spyria is a self-hosted workspace where a team and its AI agents work in the same chats and channels, for engineering teams ' +
  "that want everyone to follow an agent's work, answer its questions and pick up where a colleague left off. " +
  "Each agent chat gets its own runtime container on a machine the team runs, on the prompting member's own model key; " +
  "Claude Code and Codex run on a member's own laptop with their own subscription. The chat owner opens pull requests under their own GitHub account. " +
  "One Docker Compose file runs it, and people sign in through the organization's own identity provider. " +
  'Spyria is source available under the Business Source License 1.1: free in production for organizations with up to 10 members, ' +
  'and each version becomes Apache 2.0 two years after its release.'

const productDocsOnGitHub = [
  { label: 'Documentation', path: 'docs/README.md', about: 'the index of the product docs' },
  {
    label: 'Self-hosting',
    path: 'docs/guides/self-hosting.md',
    about: 'requirements, configuration and the first workspace',
  },
  { label: 'Agents', path: 'docs/features/agents.md', about: 'harnesses, models, questions, delegation and budgets' },
  { label: 'Decision records', path: 'docs/decisions/README.md', about: 'one short record per architectural decision' },
]

async function siteDocsSections(siteOrigin: string): Promise<string[]> {
  const sections = await loadDocsSidebar()
  const linkTo = (label: string, docsPath: string) => `- [${label}](${siteOrigin}${docsRouteOf(docsPath)}.md)`
  return [
    `## Docs\n\n${linkTo('Documentation', 'README.md')}`,
    ...sections.map(
      ({ title, links }) => `## ${title}\n\n${links.map(({ label, docsPath }) => linkTo(label, docsPath)).join('\n')}`,
    ),
  ]
}

function productDocsSection(): string {
  const links = productDocsOnGitHub.map(
    ({ label, path, about }) => `- [${label}](${productRepositoryUrl}/blob/main/${path}): ${about}`,
  )
  return `## Docs\n\n${links.join('\n')}`
}

export const GET: APIRoute = async ({ site }) => {
  const siteOrigin = site?.origin ?? ''
  const docsSections = docsPublished ? await siteDocsSections(siteOrigin) : [productDocsSection()]
  const llmsText = [
    '# Spyria',
    `> ${summary}`,
    `## Site\n\n- [Home](${siteOrigin}/): what Spyria is, how people and agents work together, and what self-hosting needs`,
    ...docsSections,
  ].join('\n\n')
  return new Response(`${llmsText}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
