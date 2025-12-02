/**
 * Supabase client for middleware - used to refresh auth tokens
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/magic-link', '/callback'];
  const isPublicRoute = publicRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith('/api/webhooks') ||
      request.nextUrl.pathname.startsWith('/api/') // Allow API routes to handle their own auth
  );

  // Skip auth entirely for public routes to avoid Supabase errors
  if (isPublicRoute) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
      const url = request.nextUrl.clone();
      url.pathname = '/workspaces';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    // If Supabase auth fails, redirect to login for protected routes
    console.error('Middleware auth error:', error);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}
