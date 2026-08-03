import { describe, expect, it } from "vitest";

import { formatCompactNumber, formatJoinDate, formatRelativeDate } from "./format";

describe("formatCompactNumber", () => {
  it("keeps small numbers as-is", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(42)).toBe("42");
  });

  it("uses compact notation for thousands and millions", () => {
    expect(formatCompactNumber(1_234)).toBe("1.2K");
    expect(formatCompactNumber(12_500)).toBe("12.5K");
    expect(formatCompactNumber(2_000_000)).toBe("2M");
  });
});

describe("formatRelativeDate", () => {
  const now = new Date("2024-06-15T12:00:00Z");

  it("returns today for dates within the last 24 hours", () => {
    expect(formatRelativeDate("2024-06-15T08:00:00Z", now)).toBe("today");
  });

  it("returns yesterday for one day ago", () => {
    expect(formatRelativeDate("2024-06-14T12:00:00Z", now)).toBe("yesterday");
  });

  it("returns days ago for under a week", () => {
    expect(formatRelativeDate("2024-06-10T12:00:00Z", now)).toBe("5 days ago");
  });

  it("returns weeks ago for under a month", () => {
    expect(formatRelativeDate("2024-05-25T12:00:00Z", now)).toBe("3 weeks ago");
  });

  it("returns months ago for under a year", () => {
    expect(formatRelativeDate("2024-01-15T12:00:00Z", now)).toBe("5 months ago");
  });

  it("returns years ago for a year or more", () => {
    expect(formatRelativeDate("2020-06-15T12:00:00Z", now)).toBe("4 years ago");
  });
});

describe("formatJoinDate", () => {
  it("formats the join date as month and year", () => {
    expect(formatJoinDate("2011-01-25T18:44:36Z")).toBe("Jan 2011");
  });
});
