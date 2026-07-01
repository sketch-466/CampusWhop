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

  // Check onboarding status if user exists
  let onboardingCompleted = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    onboardingCompleted = profile?.onboarding_completed ?? false
  }

  const protectedRoutes = ['/dashboard', '/onboarding']
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const path = request.nextUrl.pathname

  // Redirect unauthenticated users away from protected routes
  if (!user && protectedRoutes.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth routes (except verify page)
  if (user && authRoutes.some(r => path.startsWith(r))) {
    // Allow verify page for email verification flow
    if (path.startsWith('/verify')) {
      return supabaseResponse
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Force onboarding if not completed (except on onboarding/verify pages)
  if (user && !onboardingCompleted && !path.startsWith('/onboarding') && !path.startsWith('/verify')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return supabaseResponse
}
