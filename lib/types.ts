import type { Document } from '@contentful/rich-text-types'
import type { Asset, Entry } from 'contentful'

// SEO
export interface ISeoFields {
  ogTitle?: string
  ogDescription?: string
  ogImage?: Asset
  ogImageAltText?: string
  ogType?: string
  robotsNoIndex?: boolean
  robotsNoFollow?: boolean
  sitemap?: boolean
}

export type ISeo = Entry<ISeoFields>

// Navigation Item
export interface INavigationItemFields {
  label: string
  url: string
  openInNewTab?: boolean
  isExternal?: boolean
}

export type INavigationItem = Entry<INavigationItemFields>

// Social Link
export interface ISocialLinkFields {
  platform: string
  url: string
  handle?: string
}

export type ISocialLink = Entry<ISocialLinkFields>

// Global Settings
export interface IGlobalSettingsFields {
  internalName: string
  siteName: string
  domain?: string
  primaryNavigation?: INavigationItem[]
  footerNavigation?: INavigationItem[]
  socialLinks?: ISocialLink[]
  copyright?: string
  defaultSeoMetadata?: ISeo
  primaryColorDefault?: string
  backgroundColorDefault?: string
  inkColorDefault?: string
}

export type IGlobalSettings = Entry<IGlobalSettingsFields>

// Tool
export interface IToolFields {
  name: string
  slug: string
  description?: string
  category?: string
  vendor?: string
  url?: string
  status?: 'Active' | 'Testing' | 'Retired'
  sortOrder?: number
  notes?: string
}

export type ITool = Entry<IToolFields>

// Field Note
export interface IFieldNoteFields {
  entryNumber: number
  title: string
  slug: string
  dek?: string
  entryType: 'Learning' | 'Building' | 'Testing' | 'Observing'
  body?: Document
  publishedDate: string
  readingTimeMinutes?: number
  relatedTools?: ITool[]
  seo?: ISeo
  featured?: boolean
}

export type IFieldNote = Entry<IFieldNoteFields>

// Parsed types for easier use in components
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
  robotsNoIndex?: boolean
  robotsNoFollow?: boolean
  sitemap?: boolean
}

export interface ParsedGlobalSettings {
  siteName: string
  domain?: string
  primaryNavigation: ParsedNavigationItem[]
  footerNavigation: ParsedNavigationItem[]
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
}
