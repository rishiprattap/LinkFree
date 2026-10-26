import { Studio } from "@/components/studio";
export const metadata = {
  title: "Local studio",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Studio local />;
}
