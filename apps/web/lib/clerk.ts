import { clerkClient } from '@clerk/nextjs/server'
import prisma from './prisma'

const USERNAME_MAX_LENGTH = 30
const GENERATED_USERNAME_PATTERN = /^user_[a-z0-9_]{4,}$/i

const getField = (source: any, ...keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

export const isGeneratedUsername = (username?: string | null) => {
  return GENERATED_USERNAME_PATTERN.test(username || '')
}

export const getClerkPrimaryEmail = (userData: any): string | null => {
  const emailAddresses = userData?.emailAddresses || userData?.email_addresses || []
  const primaryEmailId = userData?.primaryEmailAddressId || userData?.primary_email_address_id
  const primaryEmail = emailAddresses.find((email: any) => email.id === primaryEmailId)
  return primaryEmail?.emailAddress || primaryEmail?.email_address || emailAddresses[0]?.emailAddress || emailAddresses[0]?.email_address || null
}

const normalizeUsername = (value?: string | null) => {
  const normalized = (value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, USERNAME_MAX_LENGTH)

  return normalized.length >= 3 ? normalized : ''
}

export const getClerkUsernameBase = (userData: any) => {
  const email = getClerkPrimaryEmail(userData)
  const emailHandle = email?.split('@')[0]
  const fullName = [
    getField(userData, 'firstName', 'first_name'),
    getField(userData, 'lastName', 'last_name'),
  ].filter(Boolean).join(' ')
  const clerkId = String(getField(userData, 'id') || '')

  return (
    normalizeUsername(getField(userData, 'username')) ||
    normalizeUsername(emailHandle) ||
    normalizeUsername(fullName) ||
    normalizeUsername(`user_${clerkId.slice(-8)}`) ||
    'builder'
  )
}

/**
 * Generates an available username based on Clerk user data using Prisma
 */
export async function getAvailableClerkUsername(userData: any, userId: string) {
  const baseUsername = getClerkUsernameBase(userData)

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? '' : `_${attempt + 1}`
    const username = `${baseUsername.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`
    
    // Check uniqueness using Prisma
    const existing = await prisma.profile.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
        id: {
          not: userId,
        },
      },
      select: { id: true },
    })

    if (!existing) {
      return username
    }
  }

  return `user_${String(userId).slice(-8).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`
}

/**
 * Safe helper to fetch and initialize Clerk client instance
 */
export async function getClerkClientInstance() {
  return await clerkClient()
}
