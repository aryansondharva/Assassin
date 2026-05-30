import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { handleApiError, NotFoundError } from '@/lib/errors'
import type { Profile } from '@/types/database'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
})

/**
 * GET /api/profile/user/[username]
 * Get specific user's public profile by username
 * Respects privacy settings for fields like email, phone, and address
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    let { username } = params
    if (username.startsWith('@')) {
      username = username.slice(1)
    }
    
    const client = await pool.connect()
    let profile;
    
    try {
      const { rows } = await client.query(
        'SELECT * FROM public.profiles WHERE username = $1',
        [username]
      )
      
      if (rows.length === 0) {
        throw new NotFoundError('Profile not found')
      }
      profile = rows[0]
    } finally {
      client.release()
    }
    
    // Get current user to determine if this is their own profile (imported from @clerk/nextjs/server)
    const user = await currentUser()
    
    // If viewing own profile, return all fields
    if (user && user.id === profile.id) {
      return NextResponse.json(profile as Profile)
    }
    
    // Privacy Logic: filter fields based on flags
    const publicProfile: any = {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      bio: profile.bio,
      readme: profile.readme,
      skills: profile.skills,
      interests: profile.interests,
      university: profile.university,
      education: profile.education,
      degree_type: profile.degree_type,
      graduation_year: profile.graduation_year,
      graduation_month: profile.graduation_month,
      roles: profile.roles,
      github_url: profile.github_url,
      linkedin_url: profile.linkedin_url,
      twitter_url: profile.twitter_url,
      portfolio_url: profile.portfolio_url,
      created_at: profile.created_at
    }

    // Only include sensitive fields if user has opted to make them public
    if (profile.is_email_public) {
      publicProfile.email = profile.email
    }
    if (profile.is_phone_public) {
      publicProfile.phone = profile.phone
    }
    if (profile.is_address_public) {
      publicProfile.address = profile.address
    }
    
    return NextResponse.json(publicProfile)
  } catch (error) {
    return handleApiError(error)
  }
}
