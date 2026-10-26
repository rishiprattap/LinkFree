import { Studio } from "@/components/studio";
export const metadata = {
  title: "Your workspace",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Studio />;
}
