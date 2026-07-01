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

  // Routes that require no auth
  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify', '/auth/callback']

  // If logged in and trying to access auth pages → redirect to dashboard
  if (user && ['/login', '/register'].includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If not logged in and trying to access protected routes → redirect to login
  if (!user && !publicRoutes.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in but onboarding not complete → force to onboarding
  // (except if already going to onboarding or callback)
  if (user && !path.startsWith('/onboarding') && !path.startsWith('/auth')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_completed && path !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}