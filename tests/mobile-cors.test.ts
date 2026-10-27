import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

afterEach(() => vi.unstubAllEnvs());
describe("native CORS boundary", () => {
  it("permits the configured native preflight without cookies", () => {
    vi.stubEnv("MOBILE_APP_ORIGIN", "https://localhost");
    const result = proxy(new NextRequest("https://linkfree.test/api/owner", {
      method: "OPTIONS", headers: { origin: "https://localhost" },
    }));
    expect(result.status).toBe(204);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("https://localhost");
    expect(result.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
    expect(result.headers.has("Access-Control-Allow-Credentials")).toBe(false);
  });
  it("does not grant CORS to other origins or when disabled", () => {
    for (const configured of ["", "https://localhost"]) {
      vi.stubEnv("MOBILE_APP_ORIGIN", configured);
      const result = proxy(new NextRequest("https://linkfree.test/api/owner", {
        method: "OPTIONS", headers: { origin: "https://attacker.test" },
      }));
      expect(result.headers.has("Access-Control-Allow-Origin")).toBe(false);
    }
  });
});
