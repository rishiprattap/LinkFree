import { ImageResponse } from "next/og";
import { findProfile } from "@/lib/server";
import { usernameSchema } from "@/lib/model";
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const p = usernameSchema.safeParse(username).success
    ? await findProfile(username)
    : null;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: p?.theme.background || "#e5f3e9",
        color: p?.theme.text || "#183e31",
      }}
    >
      <div style={{ fontSize: 26, display: "flex" }}>
        LINKFREE / {p?.username || "CREATE YOUR SPACE"}
      </div>
      <div
        style={{
          fontSize: 76,
          fontWeight: 700,
          marginTop: 40,
          display: "flex",
        }}
      >
        {p?.displayName || "Everything you do. One link."}
      </div>
      <div style={{ fontSize: 30, marginTop: 24, display: "flex" }}>
        {p?.bio.slice(0, 180) || "A home for everything you create."}
      </div>
    </div>,
    size,
  );
}
