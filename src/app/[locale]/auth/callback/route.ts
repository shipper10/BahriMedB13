import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code && type === "recovery") {
    return NextResponse.redirect(`${origin}/ar/reset-password?code=${code}`);
  }

  return NextResponse.redirect(`${origin}/ar`);
}
