import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

const protectedPaths = ['/waiter', '/counter', '/kitchen'];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if path is protected
    const isProtectedPath = protectedPaths.some(p => path.startsWith(p));

    if (!isProtectedPath) {
        return NextResponse.next();
    }

    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userRole = payload.role as string;

        // Check if user is accessing their own role's page
        const requestedRole = path.split('/')[1]; // e.g., 'waiter', 'counter', 'kitchen'

        if (userRole !== requestedRole) {
            // Redirect to their correct role page
            return NextResponse.redirect(new URL(`/${userRole}`, request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Invalid token, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }
}

export const config = {
    matcher: ['/waiter/:path*', '/counter/:path*', '/kitchen/:path*'],
};
