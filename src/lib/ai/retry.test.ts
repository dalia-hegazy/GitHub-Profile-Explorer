import { describe, expect, it, vi } from "vitest";

import { withRetryOnRateLimit } from "./retry";

describe("withRetryOnRateLimit", () => {
  it("returns the value on the first successful call", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetryOnRateLimit(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on a 429 rate-limit error then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ statusCode: 429, message: "rate limited" })
      .mockResolvedValueOnce("ok");

    await expect(withRetryOnRateLimit(fn, 2, 1)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rethrows non-rate-limit errors immediately", async () => {
    const error = new Error("boom");
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetryOnRateLimit(fn, 2, 1)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rethrows the rate-limit error after exhausting retries", async () => {
    const error = { statusCode: 429, message: "quota exceeded" };
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetryOnRateLimit(fn, 2, 1)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});