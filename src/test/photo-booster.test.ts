import { describe, expect, it } from "vitest";
import { boostPixels } from "@/lib/photo-booster";

describe("conservative photo booster", () => {
  it("brightens dark photos without changing the source", () => {
    const source = new Uint8ClampedArray([60, 60, 60, 255]);
    const result = boostPixels(source);
    expect(result[0]).toBeGreaterThan(60);
    expect(source[0]).toBe(60);
  });
  it("reduces warm cast only with neutral reference pixels", () => {
    const source = new Uint8ClampedArray(Array.from({ length: 30 }, () => [180, 165, 150, 255]).flat());
    const result = boostPixels(source);
    expect((result[0] ?? 0) - (result[2] ?? 0)).toBeLessThan(30);
  });
  it("keeps visible dark defects darker than their surrounding fabric", () => {
    const result = boostPixels(new Uint8ClampedArray([100, 100, 100, 255, 25, 25, 25, 255]));
    expect(result[4]).toBeLessThan((result[0] ?? 0) - 40);
  });
  it("preserves alpha and leaves already bright neutral photos unchanged", () => {
    const source = new Uint8ClampedArray([200, 200, 200, 255, 0, 0, 0, 0]);
    expect(boostPixels(source)).toEqual(source);
  });
});