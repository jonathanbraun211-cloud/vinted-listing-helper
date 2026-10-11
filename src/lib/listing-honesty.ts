export type ListingHonesty = { flaws: string[]; description: string };

/** Each observed flaw must survive both the preview and copied description. */
export function validateListingHonesty(listing: ListingHonesty) {
  if (!Array.isArray(listing.flaws) || typeof listing.description !== "string" ||
    listing.flaws.some((flaw) => typeof flaw !== "string" || !flaw.trim() || !listing.description.toLowerCase().includes(flaw.toLowerCase()))) {
    throw new Error("Sichtbare Mängel fehlen in der Beschreibung");
  }
  return listing;
}