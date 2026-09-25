import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-memory rate limit store
// Resets on server restart — acceptable for Edge/Vercel serverless
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS = {
  '/login': { max: 10, windowMs: 15 * 60 * 1000 },       // 10 attempts per 15 min
  '/register': { max: 5, windowMs: 60 * 60 * 1000 },      // 5 attempts per hour
  '/forgot-password': { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
}

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path}`
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[path as keyof typeof RATE_LIMITS]
  if (!config) return { allowed: true }

  const key = getRateLimitKey(ip, path)
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true }
  }

  if (record.count >= config.max) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) }
  }

  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const path = request.nextUrl.pathname
  const method = request.method

  // Rate limit POST requests to auth routes
  if (method === 'POST' && path in RATE_LIMITS) {
    const ip = getClientIp(request)
    const { allowed, retryAfter } = checkRateLimit(ip, path)

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many attempts. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMITS[path as keyof typeof RATE_LIMITS]?.max),
          },
        }
      )
    }
  }

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
    '/api/webhooks/paystack',
    '/api/feature/verify',
    '/api/verification/upload', // if we use a route handler for uploads
  ]

  const postOnboardingDestinations = [
  '/creator-dashboard',
  '/dashboard',
  '/marketplace/new',
  '/verification',
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