import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../authOptions";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session) {
    return NextResponse.redirect(new URL('/api/auth/session', request.url));
  } else {
    return NextResponse.redirect(new URL('/sign-in?error=GoogleAuthFailed', request.url));
  }
}