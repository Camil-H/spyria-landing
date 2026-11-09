import { readFileSync } from 'node:fs'
import { productRepositoryUrl } from '../site'

export const productDocsDirectory = `${process.cwd()}/.product/docs`

export function readProductRef(): string {
  return readFileSync(`${process.cwd()}/product.ref`, 'utf8').trim()
}

export function readDocsDates(): Record<string, string> {
  return JSON.parse(readFileSync(`${process.cwd()}/.product/docs-dates.json`, 'utf8'))
}

export function productFileUrl(repositoryPath: string, ref: string): string {
  return `${productRepositoryUrl}/blob/${ref}/${repositoryPath}`
}

export function editOnGitHubUrl(docsPath: string): string {
  return `${productRepositoryUrl}/blob/main/docs/${docsPath}`
}
