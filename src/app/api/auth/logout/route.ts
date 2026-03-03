import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const response = NextResponse.redirect(new URL('/', baseUrl))
  
  // Delete the session cookie
  response.cookies.delete(sessionOptions.cookieName)
  
  return response
}
