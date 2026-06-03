import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Admin Route Protection
  if (pathname.startsWith("/admin")) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin' && decoded.role !== 'moderator') {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 2. User Route Protection
  if (pathname.startsWith("/user")) {
    if (pathname === "/user/auth") {
      const token = request.cookies.get("auth_token")?.value;
      const nextAuthToken = request.cookies.get("next-auth.session-token")?.value || 
                            request.cookies.get("__Secure-next-auth.session-token")?.value;
      if (token || nextAuthToken) {
        return NextResponse.redirect(new URL("/user/dashboard/create", request.url));
      }
      return NextResponse.next();
    }
    const token = request.cookies.get("auth_token")?.value;
    const nextAuthToken = request.cookies.get("next-auth.session-token")?.value || 
                          request.cookies.get("__Secure-next-auth.session-token")?.value;
    
    if (!token && !nextAuthToken) {
      return NextResponse.redirect(new URL("/user/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
