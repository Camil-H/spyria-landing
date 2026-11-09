import { execFileSync } from 'node:child_process'

const buildDate = new Date().toISOString()

const git = (...args: string[]) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

export function lastCommitDateOf(sourceFiles: string[]): string {
  try {
    if (git('rev-parse', '--is-shallow-repository') === 'true') return git('log', '-1', '--format=%cI', 'HEAD')
    return git('log', '-1', '--format=%cI', '--', ...sourceFiles) || buildDate
  } catch {
    return buildDate
  }
}
