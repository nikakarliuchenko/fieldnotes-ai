import type { Document } from '@contentful/rich-text-types'
import type { EntryFieldTypes, EntrySkeletonType } from 'contentful'

// ── Skeleton Types (contentful SDK v11) ──

export type ISeoSkeleton = EntrySkeletonType<{
  ogTitle?: EntryFieldTypes.Symbol
  ogDescription?: EntryFieldTypes.Text
  ogImage?: EntryFieldTypes.AssetLink
  ogImageAltText?: EntryFieldTypes.Symbol
  ogType?: EntryFieldTypes.Symbol
  ogMetaKeywords?: EntryFieldTypes.Array<EntryFieldTypes.Symbol>
  robotsNoIndex?: EntryFieldTypes.Boolean
  robotsNoFollow?: EntryFieldTypes.Boolean
  robotsNoArchive?: EntryFieldTypes.Boolean
  robotsUnavailableAfter?: EntryFieldTypes.Date
  sitemap?: EntryFieldTypes.Boolean
}, 'seo'>

export type INavigationItemSkeleton = EntrySkeletonType<{
  label: EntryFieldTypes.Symbol
  url: EntryFieldTypes.Symbol
  openInNewTab?: EntryFieldTypes.Boolean
  isExternal?: EntryFieldTypes.Boolean
}, 'navigationItem'>

export type ISocialLinkSkeleton = EntrySkeletonType<{
  platform: EntryFieldTypes.Symbol
  url: EntryFieldTypes.Symbol
  handle?: EntryFieldTypes.Symbol
}, 'socialLink'>

export type IGlobalSettingsSkeleton = EntrySkeletonType<{
  internalName: EntryFieldTypes.Symbol
  siteName: EntryFieldTypes.Symbol
  domain?: EntryFieldTypes.Symbol
  logo?: EntryFieldTypes.AssetLink
  primaryNavigation?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<INavigationItemSkeleton>>
  socialLinks?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<ISocialLinkSkeleton>>
  copyright?: EntryFieldTypes.Symbol
  defaultSeoMetadata?: EntryFieldTypes.EntryLink<ISeoSkeleton>
}, 'globalSettings'>

export type IToolSkeleton = EntrySkeletonType<{
  name: EntryFieldTypes.Symbol
  slug: EntryFieldTypes.Symbol
  description?: EntryFieldTypes.Symbol
  category?: EntryFieldTypes.Symbol
  vendor?: EntryFieldTypes.Symbol
  url?: EntryFieldTypes.Symbol
  status?: EntryFieldTypes.Symbol<'Active' | 'Testing' | 'Retired'>
  sortOrder?: EntryFieldTypes.Integer
  notes?: EntryFieldTypes.Text
  simpleIconSlug?: EntryFieldTypes.Symbol
}, 'tool'>

export type IFieldNoteSkeleton = EntrySkeletonType<{
  entryNumber: EntryFieldTypes.Integer
  title: EntryFieldTypes.Symbol
  slug: EntryFieldTypes.Symbol
  dek?: EntryFieldTypes.Symbol
  entryType: EntryFieldTypes.Symbol<'Learning' | 'Building' | 'Testing' | 'Observing'>
  body?: EntryFieldTypes.RichText
  publishedDate: EntryFieldTypes.Date
  readingTimeMinutes?: EntryFieldTypes.Integer
  relatedTools?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<IToolSkeleton>>
  seo?: EntryFieldTypes.EntryLink<ISeoSkeleton>
  featured?: EntryFieldTypes.Boolean
  sessionCost?: EntryFieldTypes.Symbol
  totalTokens?: EntryFieldTypes.Symbol
  modelUsed?: EntryFieldTypes.Symbol
}, 'fieldNote'>

// ── Parsed Types (used in components) ──

export interface ParsedNavigationItem {
  label: string
  url: string
  openInNewTab: boolean
  isExternal: boolean
}

export interface ParsedSocialLink {
  platform: string
  url: string
  handle?: string
}

export interface ParsedSeo {
  ogTitle?: string
  ogDescription?: string
  ogImageUrl?: string
  ogImageAltText?: string
  ogType?: string
  ogMetaKeywords?: string[]
  robotsNoIndex?: boolean
  robotsNoFollow?: boolean
  robotsNoArchive?: boolean
  robotsUnavailableAfter?: string
  sitemap?: boolean
}

export interface ParsedGlobalSettings {
  siteName: string
  domain?: string
  logoUrl?: string
  primaryNavigation: ParsedNavigationItem[]
  socialLinks: ParsedSocialLink[]
  copyright?: string
  defaultSeo?: ParsedSeo
}

export interface ParsedTool {
  name: string
  slug: string
  description?: string
  category?: string
  vendor?: string
  url?: string
  status: 'Active' | 'Testing' | 'Retired'
  sortOrder: number
  simpleIconSlug?: string
}

export interface ParsedFieldNote {
  entryNumber: number
  title: string
  slug: string
  dek?: string
  entryType: 'Learning' | 'Building' | 'Testing' | 'Observing'
  body?: Document
  publishedDate: string
  readingTimeMinutes?: number
  relatedTools: ParsedTool[]
  seo?: ParsedSeo
  featured: boolean
  sessionCost?: string
  totalTokens?: string
  modelUsed?: string
}
