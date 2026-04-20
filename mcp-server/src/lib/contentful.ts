import { createClient } from 'contentful-management'

if (!process.env.CONTENTFUL_MANAGEMENT_TOKEN) throw new Error('CONTENTFUL_MANAGEMENT_TOKEN is required')

export const contentfulClient = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
})

export const SPACE_ID = process.env.CONTENTFUL_SPACE_ID ?? '7nlepvg580vx'
export const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT_ID ?? 'master'
