import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.googleusercontent.com; font-src 'self'; connect-src 'self' ${process.env.NODE_ENV === "development" ? "ws://127.0.0.1:* ws://localhost:*" : ""} https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com; frame-src https://*.firebaseapp.com https://accounts.google.com https://www.youtube-nocookie.com https://open.spotify.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
