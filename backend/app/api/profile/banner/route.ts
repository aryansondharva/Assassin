import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import type { Profile } from '@/types/database'

/**
 * POST /api/profile/banner
 * Upload banner image to Supabase Storage
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) throw new ValidationError('No file provided')
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('File must be an image (jpg, png, or webp)')
    }
    
    const maxSize = 5 * 1024 * 1024 // 5MB for banners
    if (file.size > maxSize) {
      throw new ValidationError('File size must be under 5MB')
    }
    
    const supabase = await createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })
    
    if (uploadError) throw new Error(`Failed to upload banner: ${uploadError.message}`)
    
    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(fileName)
    
    // Update profile with banner URL using pg Pool to bypass PGRST002 error
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    let updatedProfile = null;
    
    try {
      const { rows } = await client.query(
        'UPDATE public.profiles SET banner_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [publicUrl, user.id]
      );
      if (rows.length > 0) {
        updatedProfile = rows[0];
      }
    } catch (updateError: any) {
      throw new Error(`Failed to update profile with banner URL: ${updateError.message}`);
    } finally {
      client.release();
    }

    return NextResponse.json({
      message: 'Banner uploaded successfully',
      banner_url: publicUrl,
      profile: updatedProfile as Profile
    })
  } catch (error) {
    return handleApiError(error)
  }
}
