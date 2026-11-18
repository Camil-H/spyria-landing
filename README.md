# spyria-landing

The site at [spyria.dev](https://spyria.dev): what [Spyria](https://github.com/Camil-H/spyria) is, and how to install it.

```sh
bun install
bun run dev
bun run check
```

The install guides come from the `docs/` folder of the product repository at the commit in `product.ref`, fetched at build time from the public repository; no token is needed.

Built with Astro and Tailwind, served by Cloudflare Workers static assets. Rules for changes are in [AGENTS.md](AGENTS.md).

The code is MIT licensed ([LICENSE](LICENSE)); the docs content comes from the product repository and stays under its licence.
