import { z } from "zod";
export const reserved = new Set([
  "api",
  "auth",
  "dashboard",
  "studio",
  "privacy",
  "terms",
  "unsubscribe",
  "admin",
  "login",
  "signup",
  "settings",
  "favicon",
  "robots",
  "sitemap",
  "www",
  "help",
  "_next",
]);
export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9][a-z0-9_-]*$/)
  .refine((v) => !reserved.has(v), "This username is reserved");
export function safeUrl(value: string, contact = true) {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:", ...(contact ? ["mailto:", "tel:"] : [])].includes(
        u.protocol,
      ) &&
      !u.username &&
      !u.password &&
      (u.protocol !== "mailto:" || !/[\r\n]/.test(decodeURIComponent(value)))
    );
  } catch {
    return false;
  }
}
export const urlSchema = z
  .string()
  .max(2048)
  .refine((v) => safeUrl(v), "Use an http(s), mailto, or tel URL");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
/**
 * Backgrounds are uploaded through the profile editor, not pasted from an
 * arbitrary remote URL. Keeping the renderer to Firebase Storage URLs avoids
 * using the public page as a third-party image proxy or tracking surface.
 */
export function safeBackgroundImageUrl(value: string) {
  if (!value || value.length > 2048) return "";
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "firebasestorage.googleapis.com"
    )
      return "";
    const match = url.pathname.match(/^\/v0\/b\/[^/]+\/o\/(.+)$/);
    const objectPath = match ? decodeURIComponent(match[1]) : "";
    return /^backgrounds\/[A-Za-z0-9_-]+\/background$/.test(objectPath)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}
export const themeSchema = z.object({
  preset: z.enum(["mint", "midnight", "peach", "lavender", "paper"]),
  background: color,
  backgroundImage: z
    .string()
    .max(2048)
    .refine(
      (value) => !value || !!safeBackgroundImageUrl(value),
      "Upload a background using the appearance editor",
    )
    .default(""),
  accent: color,
  text: color,
  gradient: z.boolean(),
  animated: z.boolean(),
  glass: z.boolean(),
  shadow: z.boolean(),
  radius: z.enum(["square", "rounded", "pill"]),
  font: z.enum(["sans", "serif", "mono"]),
  customCss: z.string().max(1000),
});
export const defaultTheme: Theme = {
  preset: "mint",
  background: "#e5f3e9",
  backgroundImage: "",
  accent: "#174d3a",
  text: "#183e31",
  gradient: true,
  animated: false,
  glass: false,
  shadow: false,
  radius: "rounded",
  font: "sans",
  customCss: "",
};
export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().max(280),
  avatar: z.string().max(2048),
  theme: themeSchema,
  socials: z
    .array(
      z.object({
        platform: z.enum([
          "instagram",
          "youtube",
          "github",
          "linkedin",
          "website",
          "email",
        ]),
        url: urlSchema,
      }),
    )
    .max(12),
  subscribe: z.boolean(),
  published: z.boolean(),
});
export const linkSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    url: urlSchema,
    type: z.enum(["link", "youtube", "spotify", "contact"]),
    enabled: z.boolean(),
    order: z.number().finite(),
    startsAt: z
      .string()
      .max(30)
      .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid start date"),
    endsAt: z
      .string()
      .max(30)
      .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid end date"),
    password: z.string().max(128).optional(),
  })
  .refine(
    (v) =>
      !v.startsAt || !v.endsAt || Date.parse(v.startsAt) < Date.parse(v.endsAt),
    "End must be after start",
  )
  .refine(
    (v) => v.type !== "youtube" || !!embedUrl("youtube", v.url),
    "Use a valid YouTube video URL",
  )
  .refine(
    (v) => v.type !== "spotify" || !!embedUrl("spotify", v.url),
    "Use a valid Spotify track, album, playlist or episode URL",
  );
export type Theme = z.infer<typeof themeSchema>;
export type Profile = z.infer<typeof profileSchema> & {
  username: string;
  uid?: string;
};
export type LinkItem = z.infer<typeof linkSchema> & {
  id: string;
  protected?: boolean;
  passwordHash?: string;
};
export const emptyProfile: Profile = {
  username: "your-name",
  displayName: "Your little corner of the internet.",
  bio: "Everything you create. Everything you love. All in one place.",
  avatar: "",
  theme: defaultTheme,
  socials: [],
  subscribe: false,
  published: false,
};
export function visible(
  link: Pick<LinkItem, "enabled" | "startsAt" | "endsAt">,
  now = Date.now(),
) {
  return (
    link.enabled &&
    (!link.startsAt || Date.parse(link.startsAt) <= now) &&
    (!link.endsAt || Date.parse(link.endsAt) > now)
  );
}
export function embedUrl(type: string, value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    if (type === "youtube") {
      const id =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : ["youtube.com", "www.youtube.com"].includes(u.hostname)
            ? u.searchParams.get("v") ||
              u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)$/)?.[1]
            : null;
      return id && /^[\w-]{11}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null;
    }
    if (
      type === "spotify" &&
      u.hostname === "open.spotify.com" &&
      /^\/(track|album|playlist|episode)\/[a-zA-Z0-9]+$/.test(u.pathname)
    )
      return `https://open.spotify.com/embed${u.pathname}`;
  } catch {}
  return null;
}
// Declarations only. No selectors, URLs, at-rules, variables, positioning or arbitrary HTML.
export function safeStyles(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of css.split(";")) {
    const [key, ...rest] = part.split(":");
    const val = rest.join(":").trim();
    if (key?.trim() === "letter-spacing" && /^(?:[0-3](?:\.\d)?)px$/.test(val))
      out.letterSpacing = val;
    if (key?.trim() === "border-width" && /^[0-4]px$/.test(val))
      out.borderWidth = val;
    if (key?.trim() === "font-weight" && /^[4-8]00$/.test(val))
      out.fontWeight = val;
  }
  return out;
}
export function publicLink(l: LinkItem): LinkItem {
  const { passwordHash, password, ...rest } = l;
  void password;
  return { ...rest, url: passwordHash ? "" : l.url, protected: !!passwordHash };
}
export function dailyKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
