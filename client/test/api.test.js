import { afterEach, expect, test, vi } from "vitest";
import { api } from "../src/lib.js";
afterEach(() => vi.unstubAllGlobals());
test("a platform HTML rate-limit response has a useful sign-in error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => {
        throw new SyntaxError("HTML response");
      },
    }),
  );
  await expect(api("/auth/login", { method: "POST" })).rejects.toMatchObject({
    status: 429,
    message:
      "Too many sign-in attempts. Please wait a few minutes and try again.",
  });
});
