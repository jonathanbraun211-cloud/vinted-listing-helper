import { describe, expect, it } from "vitest";
import { validateListingSEO } from "@/lib/listing-rules";

const title = "Original Levi's 502 Regular Jeans | W38 L34 | Blaue Waschung | Denim Hose";
const hashtags = ["#levis", "#levis502", "#casual", "#streetwear", "#regularfit", "#denim", "#jeans", "#hose"];

describe("Vinted SEO rules", () => {
  it("accepts four pipe-separated title blocks and rejects missing or empty blocks", () => {
    expect(validateListingSEO({ title, hashtags }).title).toBe(title);
    expect(() => validateListingSEO({ title: "Levi's Jeans W38 Blau", hashtags })).toThrow();
    expect(() => validateListingSEO({ title: "Jeans | W38 |  | Denim", hashtags })).toThrow();
  });
  it("allows at most 90 title characters without losing the pipe structure", () => {
    const boundaryTitle = `${"a".repeat(78)} | S | B | D`;
    expect(boundaryTitle.length).toBe(90);
    expect(validateListingSEO({ title: boundaryTitle, hashtags }).title.length).toBe(90);
    expect(() => validateListingSEO({ title: `a${boundaryTitle}`, hashtags })).toThrow();
  });
  it("requires between 8 and 12 hashtags inclusive", () => {
    expect(validateListingSEO({ title, hashtags }).hashtags.length).toBe(8);
    const twelve = [...hashtags, "#menswear", "#blau", "#w38", "#l34"];
    expect(validateListingSEO({ title, hashtags: twelve }).hashtags.length).toBe(12);
    expect(() => validateListingSEO({ title, hashtags: hashtags.slice(0, 7) })).toThrow();
    expect(() => validateListingSEO({ title, hashtags: [...twelve, "#mode"] })).toThrow();
  });
  it("rejects duplicate and space-containing tags instead of counting them as targeted tags", () => {
    expect(() => validateListingSEO({ title, hashtags: [...hashtags.slice(0, 7), "#LEVIS"] })).toThrow();
    expect(() => validateListingSEO({ title, hashtags: [...hashtags.slice(0, 7), "#regular fit"] })).toThrow();
  });
});