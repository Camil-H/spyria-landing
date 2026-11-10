import type { APIRoute } from 'astro'
import { heroStoryStylesheet } from '../story/hero-story'

export const GET: APIRoute = () =>
  new Response(`${heroStoryStylesheet}\n`, { headers: { 'Content-Type': 'text/css; charset=utf-8' } })
