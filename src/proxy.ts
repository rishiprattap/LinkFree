import { NextRequest, NextResponse } from "next/server";
export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (
    !origin ||
    !process.env.MOBILE_APP_ORIGIN ||
    origin !== process.env.MOBILE_APP_ORIGIN
  )
    return NextResponse.next();
  const response =
    req.method === "OPTIONS"
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Vary", "Origin");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type",
  );
  response.headers.set("Access-Control-Max-Age", "600");
  return response;
}
export const config = { matcher: "/api/:path*" };
