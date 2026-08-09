import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set({ name, value, ...options })
      })
      supabaseResponse = NextResponse.next({ request })
      cookiesToSet.forEach(({ name, value, options }) => {
        supabaseResponse.cookies.set({ name, value, ...options })
      })
    },
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Fully public — no auth needed at all
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify',
    '/auth/callback',
    '/marketplace',
    '/creators',
    '/gigs',
    '/store',
    '/opportunities',
    '/jobs',
  ]

  const isPublic = publicRoutes.some(r => path === r || path.startsWith(r + '/'))

  // Auth pages → redirect logged-in users to dashboard
  if (user && ['/login', '/register'].includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protected routes → redirect unauthenticated users to login
  // Preserve the original URL so they return after signing in
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Onboarding gate — logged-in users who haven't completed onboarding
  if (
  user &&
  !path.startsWith('/onboarding') &&
  !path.startsWith('/auth') &&
  !isPublic
) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}