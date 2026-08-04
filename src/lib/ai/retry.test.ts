import { describe, expect, it, vi } from "vitest";

import { isRateLimitError, withModelFallback } from "./retry";

describe("withModelFallback", () => {
  it("returns the value on the first successful call", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withModelFallback(fn, [1, 2, 3])).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(0);
  });

  it("moves to the next model on a 429 rate-limit error", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ statusCode: 429, message: "rate limited" })
      .mockResolvedValueOnce("ok");

    await expect(withModelFallback(fn, [1, 2, 3])).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][0]).toBe(1);
  });

  it("rethrows non-rate-limit errors immediately", async () => {
    const error = new Error("boom");
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withModelFallback(fn, [1, 2, 3])).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rethrows the rate-limit error after exhausting all models", async () => {
    const error = { statusCode: 429, message: "quota exceeded" };
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withModelFallback(fn, [1, 2, 3])).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("runs at least once when no models are provided", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withModelFallback(fn, [])).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("isRateLimitError", () => {
  it("detects a 429 status code", () => {
    expect(isRateLimitError({ statusCode: 429 })).toBe(true);
    expect(isRateLimitError({ status: 429 })).toBe(true);
    expect(isRateLimitError({ statusCode: 500 })).toBe(false);
  });

  it("detects 429 in the message with rate/quota keywords", () => {
    expect(
      isRateLimitError(new Error("HTTP 429: quota exceeded")),
    ).toBe(true);
    expect(isRateLimitError(new Error("something else"))).toBe(false);
  });
});