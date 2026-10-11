import { createServerFn } from "@tanstack/react-start";
import { titleSchema, hashtagsSchema, priceHintSchema, validateListingSEO } from "./listing-rules";

export type Listing = {
  title: string;
  description: string;
  hashtags: string[];
  category: string;
  brand: string;
  size: string;
  material: string;
  condition: string;
  color: string;
  price_suggested: number;
  price_min: number;
  price_max: number;
  price_reason: string;
  reason_min: string;
  reason_optimal: string;
  reason_max: string;
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title", "description", "hashtags", "category", "brand", "size", "material",
    "condition", "color", "price_suggested", "price_min", "price_max", "price_reason", "reason_min", "reason_optimal", "reason_max",
  ],
  properties: {
    title: titleSchema,
    description: { type: "string" },
    hashtags: hashtagsSchema,
    category: { type: "string" },
    brand: { type: "string" },
    size: { type: "string" },
    material: { type: "string" },
    condition: { type: "string" },
    color: { type: "string" },
    price_suggested: { type: "number" },
    price_min: { type: "number" },
    price_max: { type: "number" },
    price_reason: { type: "string" },
    reason_min: priceHintSchema,
    reason_optimal: priceHintSchema,
    reason_max: priceHintSchema,
  },
};

const PROMPT = `Du bist Experte für Second-Hand-Mode und Vinted-Inserate im deutschsprachigen Raum.
Analysiere die Fotos (Kleidungsstück und ggf. Waschetikett/Größenlabel).
Bestimme Artikelart, Marke, Größe, Materialzusammensetzung (vom Etikett), Farbe und Zustand
(Vinted-Stufen: "Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Zufriedenstellend").
Wenn etwas nicht erkennbar ist, schreibe "Unbekannt".
Titel: exakt vier nichtleere Blöcke, getrennt durch " | ", nach dieser Vinted-SEO-Formel:
[Original/Vintage falls zutreffend] [Marke] [Modell/Passform] [Kategorie] | [Größe / Bundweite / Maße] | [Farbe / Waschung / Besonderheit] | [Synonym / Style-Keyword].
Ziel: kompakte 80–90 Zeichen, harte Obergrenze 90 Zeichen inklusive Leerzeichen und Pipes; kürzer, wenn nur wenige Fakten erkennbar sind. Alle vier Blöcke erhalten; bei Platzmangel optionale Adjektive kürzen, nie Größe oder Modellnummer abschneiden. Suchbegriffe statt Füllwörter.
Beispiel: "Original Levi's 502 Regular Jeans | W38 L34 | Blaue Waschung | Denim Hose".
"Original" nur bei erkennbaren Echtheitsmerkmalen, ohne Echtheitsgarantie; "Vintage" nur bei klaren Hinweisen. Modell, Passform und Maße nicht erfinden. Unbekannte Marke/Größe als "Unbekannt" angeben; letztes Segment mit passendem Synonym/Style-Suchbegriff füllen.
Beschreibung: 3-5 sympathische, ehrliche Sätze auf Deutsch, mit Material, Passform, Zustand, ohne Emojis-Spam (max. 2).
Hashtags: genau 8 bis 12 eindeutige, zielgerichtete Tags, kleingeschrieben, ohne Leerzeichen, mit #.
Ausgewogener Mix aus Marke & Modell (z. B. #levis #levis502), Stil & Ästhetik (z. B. #casual #streetwear) und Schnitt & Kategorie (z. B. #regularfit #denim #jeans).
Alle drei Gruppen abdecken, soweit erkennbar. Nur tatsächlich passende Suchbegriffe: kein #vintage oder #y2k ohne Hinweise, keine erfundenen Marken/Modelle, keine doppelten oder generischen Füll-Tags. Bei unbekannter Marke mehr passende Schnitt-, Kategorie-, Farb- und Stil-Tags nutzen.
Preise in EUR, realistisch nach aktuellen Vinted-Second-Hand-Preisen für genau diese Marke, Artikelart und diesen Zustand:
- price_min = Mindestpreis (Schnellverkauf / Untergrenze, verkauft sich meist innerhalb weniger Tage)
- price_suggested = Optimalpreis (empfohlener Angebotspreis, bestes Verhältnis aus Erlös und Verkaufsdauer)
- price_max = Maximalpreis (Startpreis für Verhandlungen / Bestpreis, wenn Käufer handeln)
Es muss gelten: price_min < price_suggested < price_max.
price_reason: 2-3 verständliche Sätze Marktbegründung (Markenwert, typische Second-Hand-Preise vergleichbarer Artikel, Nachfrage/Saison, Zustand, Neupreis-Bezug). Als Schätzung kennzeichnen; keine aktuellen Vinted-Angebote oder Verkaufsdaten als geprüft darstellen und keine Verkaufsdauer garantieren.
reason_min / reason_optimal / reason_max: je nur EIN extrem kurzer Hinweis, maximal 7 Wörter und 60 Zeichen, keine weiteren Sätze. Beispiele: "Für schnellen Verkauf", "Bester Erlös & Nachfrage", "Spielraum für Preisangebote".`;

export const analyzeItem = createServerFn({ method: "POST" })
  .inputValidator((d: { images: string[] }) => {
    if (!Array.isArray(d?.images) || d.images.length < 1 || d.images.length > 3)
      throw new Error("1-3 Bilder erforderlich");
    for (const i of d.images)
      if (typeof i !== "string" || !i.startsWith("data:image/") || i.length > 4_000_000)
        throw new Error("Ungültiges Bild");
    return d;
  })
  .handler(async ({ data }): Promise<{ ok: true; listing: Listing } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "KI ist nicht konfiguriert." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: PROMPT },
              ...data.images.map((url) => ({ type: "input_image", image_url: url })),
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "listing", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      let msg = "Analyse fehlgeschlagen.";
      if (res.status === 429) msg = "Zu viele Anfragen – bitte kurz warten.";
      else if (res.status === 402) msg = "KI-Guthaben aufgebraucht.";
      else { try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? msg; } catch {} }
      return { ok: false, error: msg };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error")
            return { ok: false, error: ev.response?.error?.message ?? ev.message ?? "Analyse fehlgeschlagen." };
        } catch {}
      }
    }
    try {
      const listing = JSON.parse(out) as Listing;
      validateListingSEO(listing);
      return { ok: true, listing };
    } catch {
      return { ok: false, error: "Die KI konnte das Bild nicht auswerten." };
    }
  });
