import { readFileSync } from 'node:fs'
import type { APIRoute } from 'astro'

export const GET: APIRoute = () =>
  new Response(readFileSync(`${process.cwd()}/.product/deploy/install.sh`, 'utf8'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
