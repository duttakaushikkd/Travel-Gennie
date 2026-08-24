import { NextRequest, NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";

const publicPaths = ["/sign-in", "/sign-up", "/eve/v1/health"];

function isPublic(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/eve/v1") || isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    return NextResponse.next();
  }

  const signIn = new URL("/sign-in", request.url);
  signIn.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
