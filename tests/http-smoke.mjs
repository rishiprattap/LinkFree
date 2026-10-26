import assert from "node:assert/strict";
const origin = process.env.SMOKE_ORIGIN || "http://127.0.0.1:3000";
for (const [path, status] of [
  ["/", 200],
  ["/studio", 200],
  ["/auth", 200],
  ["/dashboard", 200],
  ["/privacy", 200],
  ["/terms", 200],
  ["/api/owner", 401],
  ["/profile-that-does-not-exist", 404],
]) {
  const response = await fetch(origin + path);
  assert.equal(response.status, status, `${path}: unexpected status`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(
    response.headers
      .get("content-security-policy")
      ?.includes("object-src 'none'"),
  );
  console.log(`${status} ${path}`);
}
const response = await fetch(origin + "/api/public/example", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "view" }),
});
assert.equal(
  response.status,
  503,
  "Unconfigured production interactions must fail closed",
);
console.log(
  "503 public interactions fail closed without production configuration",
);
const crossOrigin = await fetch(origin + "/api/public/example", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://untrusted.example" },
  body: JSON.stringify({ action: "view" }),
});
assert.equal(crossOrigin.status, 403);
console.log("403 cross-origin interaction rejected");
