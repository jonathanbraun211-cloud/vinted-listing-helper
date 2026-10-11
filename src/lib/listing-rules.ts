export const titleSchema = { type: "string", maxLength: 90, pattern: "^[^|]+ \\| [^|]+ \\| [^|]+ \\| [^|]+$" };
export const hashtagsSchema = {
  type: "array", minItems: 8, maxItems: 12,
  items: { type: "string", pattern: "^#[\\p{L}\\p{N}_]+$" },
};
export const priceHintSchema = { type: "string", maxLength: 60 };

/** Reject malformed SEO output rather than inventing product details or filler tags. */
export function validateListingSEO(listing: { title: string; hashtags: string[] }) {
  if (typeof listing.title !== "string" || [...listing.title].length > 90 ||
      listing.title.split(" | ").length !== 4 ||
      listing.title.split(" | ").some((part) => !part.trim() || part.includes("|"))) {
    throw new Error("Ungültiger Inserat-Titel");
  }
  if (!Array.isArray(listing.hashtags) || listing.hashtags.length < 8 || listing.hashtags.length > 12 ||
      listing.hashtags.some((tag) => typeof tag !== "string" || !/^#[\p{L}\p{N}_]+$/u.test(tag)) ||
      new Set(listing.hashtags.map((tag) => tag.toLowerCase())).size !== listing.hashtags.length) {
    throw new Error("Ungültige Hashtags");
  }
  return listing;
}