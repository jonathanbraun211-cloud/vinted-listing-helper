import { createServerFn } from "@tanstack/react-start";

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
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title", "description", "hashtags", "category", "brand", "size", "material",
    "condition", "color", "price_suggested", "price_min", "price_max", "price_reason",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
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
  },
};

const PROMPT = `Du bist Experte für Second-Hand-Mode und Vinted-Inserate im deutschsprachigen Raum.
Analysiere die Fotos (Kleidungsstück und ggf. Waschetikett/Größenlabel).
Bestimme Artikelart, Marke, Größe, Materialzusammensetzung (vom Etikett), Farbe und Zustand
(Vinted-Stufen: "Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Zufriedenstellend").
Wenn etwas nicht erkennbar ist, schreibe "Unbekannt".
Titel: max. 60 Zeichen, Format "Marke Artikel Farbe Größe", suchoptimiert.
Beschreibung: 3-5 sympathische, ehrliche Sätze auf Deutsch, mit Material, Passform, Zustand, ohne Emojis-Spam (max. 2).
Hashtags: 5-8 relevante, ohne Leerzeichen, mit #.
Preis in EUR: realistisch nach aktuellen Vinted-Second-Hand-Preisen, kurze Begründung.`;

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
    const key = process.env.LOVABLE_API_KEY;
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
      return { ok: true, listing: JSON.parse(out) as Listing };
    } catch {
      return { ok: false, error: "Die KI konnte das Bild nicht auswerten." };
    }
  });
