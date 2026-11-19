import type { APIRoute } from 'astro'
import { installOverviewRoute } from '../docs/routes'
import { loadInstallGuideLinks } from '../docs/sidebar'
import { productRepositoryUrl } from '../site'

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
  { label: 'Agents', path: 'docs/features/agents.md', about: 'harnesses, models, questions, delegation and budgets' },
  { label: 'Decision records', path: 'docs/decisions/README.md', about: 'one short record per architectural decision' },
]

async function installGuidesSection(siteOrigin: string): Promise<string> {
  const links = (await loadInstallGuideLinks()).map(({ label, route }) => `- [${label}](${siteOrigin}${route}.md)`)
  return `## Install guides\n\n${links.join('\n')}`
}

function siteSection(siteOrigin: string): string {
  const links = [
    `- [Home](${siteOrigin}/): what Spyria is, how people and agents work together, and what self-hosting needs`,
    `- [Install Spyria](${siteOrigin}${installOverviewRoute}): where to run Spyria and the one-step install`,
  ]
  return `## Site\n\n${links.join('\n')}`
}

function productDocsSection(): string {
  const links = productDocsOnGitHub.map(
    ({ label, path, about }) => `- [${label}](${productRepositoryUrl}/blob/main/${path}): ${about}`,
  )
  return `## Docs\n\n${links.join('\n')}`
}

export const GET: APIRoute = async ({ site }) => {
  const siteOrigin = site?.origin ?? ''
  const llmsText = [
    '# Spyria',
    `> ${summary}`,
    siteSection(siteOrigin),
    await installGuidesSection(siteOrigin),
    productDocsSection(),
  ].join('\n\n')
  return new Response(`${llmsText}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
