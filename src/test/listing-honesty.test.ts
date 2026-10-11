import { describe, expect, it } from "vitest";
import { validateListingHonesty } from "@/lib/listing-honesty";

describe("honest flaw disclosure", () => {
  it("requires visible pilling to be mentioned in the copied description", () => {
    expect(validateListingHonesty({ flaws: ["leichtes Pilling"], description: "Gepflegter Pullover mit leichtes Pilling am Saum." }).flaws).toEqual(["leichtes Pilling"]);
    expect(() => validateListingHonesty({ flaws: ["leichtes Pilling"], description: "Makelloser Pullover." })).toThrow();
  });
  it("allows no detected flaws without inventing one", () => {
    expect(validateListingHonesty({ flaws: [], description: "Auf den Fotos gepflegt, ohne erkennbare Mängel." }).flaws).toEqual([]);
  });
  it("rejects malformed or blank flaw evidence", () => {
    expect(() => validateListingHonesty({ flaws: [" "], description: "Gepflegt." })).toThrow();
  });
});