import { expect, test } from 'bun:test'
import { markdownTwin } from './twins'

const productRef = '624b4e784cf38679d7b68336e47a8eb01eef79a2'
const context = {
  fromDocsPath: 'guides/development.md',
  productRef,
  docsPublished: true,
  siteOrigin: 'https://spyria.dev',
}

test('a Markdown twin keeps the source and points its links at absolute site and repository URLs', () => {
  const source = [
    '# Development',
    '',
    'See [testing](./testing.md#fakes), the [rules](../../AGENTS.md "Rules") and [Bun](https://bun.sh).',
    '',
    'Write `[not a link](./testing.md)` in code.',
    '',
    '```sh',
    'echo "[also not](./testing.md)"',
    '```',
    '',
    '[ref]: ../decisions/',
    '',
  ].join('\n')
  expect(markdownTwin(source, context)).toBe(
    [
      '# Development',
      '',
      'See [testing](https://spyria.dev/docs/guides/testing#fakes), the ' +
        `[rules](https://github.com/Camil-H/spyria/blob/${productRef}/AGENTS.md "Rules") and [Bun](https://bun.sh).`,
      '',
      'Write `[not a link](./testing.md)` in code.',
      '',
      '```sh',
      'echo "[also not](./testing.md)"',
      '```',
      '',
      '[ref]: https://spyria.dev/docs/decisions',
      '',
    ].join('\n'),
  )
})
