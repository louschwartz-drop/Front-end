import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Admin Route Protection
  if (pathname.startsWith("/admin")) {
    // Exclude login page from check
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
        // Redirect non-admins to their dashboard or home
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 2. User Route Protection
  if (pathname.startsWith("/user")) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
