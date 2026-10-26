import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicData } from "@/lib/server";
import { usernameSchema } from "@/lib/model";
import { ProfileView } from "@/components/profile-view";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ username: string }> };
async function data(props: Props) {
  const { username } = await props.params;
  if (!usernameSchema.safeParse(username).success) return null;
  return publicData(username);
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await data(props);
  if (!d) return { title: "Profile unavailable", robots: { index: false } };
  return {
    title: d.profile.displayName,
    description: d.profile.bio,
    alternates: { canonical: `/${d.profile.username}` },
    openGraph: {
      title: d.profile.displayName,
      description: d.profile.bio,
      images: [`/${d.profile.username}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}
export default async function PublicProfile(props: Props) {
  const d = await data(props);
  if (!d) notFound();
  return <ProfileView {...d} />;
}
