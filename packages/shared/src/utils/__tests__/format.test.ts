import { describe, it, expect } from "vitest";
import { formatPercent, formatRuntime, formatMemory, capitalize } from "../format";

describe("formatPercent", () => {
  it("formats with default decimals", () => {
    expect(formatPercent(45.23)).toBe("45.2%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(45.23, 2)).toBe("45.23%");
  });
});

describe("formatRuntime", () => {
  it("formats milliseconds", () => {
    expect(formatRuntime(12)).toBe("12 ms");
  });

  it("formats seconds", () => {
    expect(formatRuntime(1234)).toBe("1.2 s");
  });
});

describe("formatMemory", () => {
  it("formats kilobytes", () => {
    expect(formatMemory(256)).toBe("256 KB");
  });

  it("formats megabytes", () => {
    expect(formatMemory(2048)).toBe("2.0 MB");
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("easy")).toBe("Easy");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });
});
