# spyria-landing

The site at [spyria.dev](https://spyria.dev): what [Spyria](https://github.com/Camil-H/spyria) is, its principles, how to install it, and its docs.

```sh
bun install
bun run dev
bun run check
```

The docs pages come from the `docs/` folder of the product repository at the commit in `product.ref`, fetched at build time; while that repository is private, set `PRODUCT_REPO_TOKEN` or sign in with the GitHub CLI.

Built with Astro and Tailwind, served by Cloudflare Workers static assets. Rules for changes are in [AGENTS.md](AGENTS.md).

The code is MIT licensed ([LICENSE](LICENSE)); the docs content comes from the product repository and stays under its licence.
