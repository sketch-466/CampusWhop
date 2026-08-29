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
    '/novels',
'/coins',
  ]

  // Routes that are valid onboarding destinations — never gate these
  const postOnboardingDestinations = [
    '/creator-dashboard',
    '/dashboard',
    '/marketplace/new',
  ]

  const isPublic = publicRoutes.some(r => path === r || path.startsWith(r + '/'))

  const isPostOnboardingDestination = postOnboardingDestinations.some(r =>
    path === r || path.startsWith(r + '/')
  )

  // Auth pages → redirect logged-in users to dashboard
  if (user && ['/login', '/register'].includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protected routes → redirect unauthenticated users to login
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Skip onboarding gate for:
  // - prefetch requests (stale cache risk)
  // - valid post-onboarding destinations (DB write lag risk)
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch' ||
    request.nextUrl.searchParams.has('_rsc')

  if (
    user &&
    !path.startsWith('/onboarding') &&
    !path.startsWith('/auth') &&
    !isPublic &&
    !isPrefetch &&
    !isPostOnboardingDestination
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