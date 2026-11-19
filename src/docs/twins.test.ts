import { expect, test } from 'bun:test'
import { markdownTwin } from './twins'

const productRef = '624b4e784cf38679d7b68336e47a8eb01eef79a2'
const context = {
  fromDocsPath: 'guides/install.md',
  productRef,
  siteOrigin: 'https://spyria.dev',
}

test('a Markdown twin keeps the source and points its links at absolute site URLs for install guides and repository URLs otherwise', () => {
  const source = [
    '# Install',
    '',
    'See [the AWS guide](./cloud-aws.md#modules), [testing](./testing.md), the [rules](../../AGENTS.md "Rules") and [Bun](https://bun.sh).',
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
      '# Install',
      '',
      'See [the AWS guide](https://spyria.dev/docs/install/aws#modules), ' +
        `[testing](https://github.com/Camil-H/spyria/blob/${productRef}/docs/guides/testing.md), the ` +
        `[rules](https://github.com/Camil-H/spyria/blob/${productRef}/AGENTS.md "Rules") and [Bun](https://bun.sh).`,
      '',
      'Write `[not a link](./testing.md)` in code.',
      '',
      '```sh',
      'echo "[also not](./testing.md)"',
      '```',
      '',
      `[ref]: https://github.com/Camil-H/spyria/blob/${productRef}/docs/decisions/README.md`,
      '',
    ].join('\n'),
  )
})
