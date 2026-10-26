import { describe, it, expect } from "vitest";
import {
  safeStyles,
  safeUrl,
  usernameSchema,
  linkSchema,
  visible,
  publicLink,
  embedUrl,
} from "../src/lib/model";
const link = {
  id: "a",
  title: "My work",
  url: "https://example.com",
  type: "link" as const,
  enabled: true,
  order: 0,
  startsAt: "",
  endsAt: "",
};
describe("Security boundaries", () => {
  it("rejects script and data URLs, credential URLs and mail header injection", () => {
    for (const s of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "https://u:p@example.com",
      "mailto:x@y.com%0aBcc:z@y.com",
    ])
      expect(safeUrl(s)).toBe(false);
    expect(safeUrl("https://example.com/?q=hello")).toBe(true);
    expect(safeUrl("tel:+15551234567")).toBe(true);
  });
  it("reserves internal routes and enforces lowercase safe usernames", () => {
    for (const u of [
      "api",
      "auth",
      "studio",
      "AName",
      "x",
      "../private",
      "a.b",
    ])
      expect(usernameSchema.safeParse(u).success).toBe(false);
    expect(usernameSchema.parse("alex-morgan")).toBe("alex-morgan");
  });
  it("filters malicious CSS and leaves only safe declarations", () => {
    expect(
      safeStyles(
        "background: url(https://evil.test);position:fixed;letter-spacing: 2px;font-weight: 600;border-width: 3px;@import: x",
      ),
    ).toEqual({ letterSpacing: "2px", fontWeight: "600", borderWidth: "3px" });
    expect(
      safeStyles(
        "letter-spacing:99px;font-weight:var(--x);border-width:expression(1)",
      ),
    ).toEqual({});
  });
  it("enforces time boundaries and disabled links", () => {
    const l = {
      ...link,
      startsAt: "2026-01-01T00:00:00Z",
      endsAt: "2026-01-02T00:00:00Z",
    };
    expect(visible(l, Date.parse(l.startsAt) - 1)).toBe(false);
    expect(visible(l, Date.parse(l.startsAt))).toBe(true);
    expect(visible(l, Date.parse(l.endsAt))).toBe(false);
    expect(visible({ ...link, enabled: false })).toBe(false);
  });
  it("rejects reversed schedules and invalid dates", () => {
    expect(
      linkSchema.safeParse({
        ...link,
        startsAt: "2026-01-02",
        endsAt: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(linkSchema.safeParse({ ...link, startsAt: "banana" }).success).toBe(
      false,
    );
  });
  it("does not expose a protected destination or hash", () => {
    const p = publicLink({
      ...link,
      passwordHash: "secret",
      password: "plain",
    });
    expect(p.url).toBe("");
    expect(p.protected).toBe(true);
    expect(p).not.toHaveProperty("passwordHash");
    expect(p).not.toHaveProperty("password");
    expect(publicLink(link).url).toBe(link.url);
  });
  it("restricts embeds to known hosts and paths", () => {
    expect(embedUrl("youtube", "https://youtu.be/abcdefghijk")).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk",
    );
    expect(
      embedUrl("youtube", "https://youtube.com.evil.test/watch?v=abcdefghijk"),
    ).toBeNull();
    expect(embedUrl("spotify", "https://open.spotify.com/track/abc123")).toBe(
      "https://open.spotify.com/embed/track/abc123",
    );
    expect(embedUrl("spotify", "https://open.spotify.com/evil")).toBeNull();
    expect(linkSchema.safeParse({ ...link, type: "youtube" }).success).toBe(
      false,
    );
  });
});
