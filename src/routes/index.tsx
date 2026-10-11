import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Tag, Sparkles, Copy, Check, Loader2, X, ShieldCheck, Coins } from "lucide-react";
import { VintedHelper } from "@/components/VintedHelper";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoSlot } from "@/components/PhotoSlot";
import { AnalysisFeedback } from "@/components/AnalysisFeedback";
import { copyWithFeedback } from "@/lib/copy-feedback";
import { analyzeItem, type Listing } from "@/lib/analyze.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kleidr – KI-Inserate für Vinted in Sekunden" },
      { name: "description", content: "Foto hochladen, KI erkennt Marke, Größe, Material und Preis – fertiges Vinted-Inserat zum Kopieren. Ohne Bots, ohne Bann-Risiko." },
      { property: "og:title", content: "Kleidr – KI-Inserate für Vinted in Sekunden" },
      { property: "og:description", content: "Vinted-optimierte Titel, Beschreibungen und Preisvorschläge per KI. 50 Inserate für 4,99 €." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FREE = 3;
const PACKS = [
  { n: 10, price: 1.49 },
  { n: 50, price: 4.99, best: true },
  { n: 150, price: 11.99 },
];

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      onClick={async () => { try { await copyWithFeedback(text); setOk(true); setTimeout(() => setOk(false), 1400); } catch { toast.error("Kopieren nicht möglich. Bitte Text manuell markieren."); } }}
      variant="ghost" size="sm" aria-label={ok ? "Kopiert" : "Kopieren"} className={`h-7 gap-1 px-2 text-xs text-primary ${ok ? "bg-primary/10" : ""}`}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{label ?? (ok ? "Kopiert" : "Kopieren")}
    </Button>
  );
}

function Index() {
  const [front, setFront] = useState<string>();
  const [labelImg, setLabelImg] = useState<string>();
  const [frontOriginal, setFrontOriginal] = useState<string>();
  const [labelOriginal, setLabelOriginal] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const v = localStorage.getItem("kleidr_credits");
    setCredits(v === null ? FREE : Number(v));
  }, []);
  const saveCredits = (n: number) => { setCredits(n); localStorage.setItem("kleidr_credits", String(n)); };

  const run = async () => {
    if (!front) return;
    if (!credits) { document.getElementById("preise")?.scrollIntoView({ behavior: "smooth" }); toast.error("Keine Credits mehr übrig."); return; }
    setLoading(true); setListing(null);
    try {
      const r = await analyzeItem({ data: { images: [frontOriginal ?? front, labelOriginal ?? labelImg, frontOriginal && front !== frontOriginal ? front : undefined].filter((image): image is string => Boolean(image)) } });
      if (!r.ok) toast.error(r.error);
      else { setListing(r.listing); saveCredits(credits - 1); setTimeout(() => document.getElementById("ergebnis")?.scrollIntoView({ behavior: "smooth" }), 50); }
    } catch { toast.error("Verbindung fehlgeschlagen. Bitte erneut versuchen."); }
    finally { setLoading(false); }
  };

  const fullText = listing
    ? `${listing.title}\n\n${listing.description}\n\n${listing.hashtags.join(" ")}`
    : "";
  const attrs: [string, string][] = listing ? [
    ["Kategorie", listing.category], ["Marke", listing.brand], ["Größe", listing.size],
    ["Zustand", listing.condition], ["Farbe", listing.color], ["Material", listing.material],
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-display text-xl font-extrabold tracking-tight">kleidr<span className="text-accent">.</span></span>
          <a href="#preise" className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground">
            <Coins className="h-4 w-4" />{credits ?? "–"} Credits
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20">
        <section className="pt-8 pb-6">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Foto rein.<br /><span className="text-primary">Vinted-Inserat raus.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">KI erkennt Marke, Größe, Material & Zustand und schlägt einen fairen Preis vor. Du kopierst – ganz ohne Bots oder Bann-Risiko.</p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <PhotoSlot label="Vorderseite" icon={Camera} value={front} onChange={setFront} onOriginalChange={setFrontOriginal} disabled={loading} />
          <PhotoSlot label="Etikett / Größe" icon={Tag} value={labelImg} onChange={setLabelImg} onOriginalChange={setLabelOriginal} disabled={loading} />
        </section>

        <Button
          onClick={run}
          disabled={!front || loading}
          className="mt-4 h-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Analysiere…</> : <><Sparkles className="h-5 w-5" />Inserat erstellen · 1 Credit</>}
        </Button>
        {loading && <AnalysisFeedback />}
        {!front && <p className="mt-2 text-center text-xs text-muted-foreground">Mindestens ein Foto der Vorderseite nötig. Etikett verbessert die Genauigkeit.</p>}

        {listing && (
          <section id="ergebnis" className="mt-8 space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Preiseinschätzung</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  ["Mindestpreis", listing.price_min, listing.reason_min, false],
                  ["Optimalpreis", listing.price_suggested, listing.reason_optimal, true],
                  ["Maximalpreis", listing.price_max, listing.reason_max, false],
                ] as const).map(([t, v, r, hi]) => (
                  <div key={t} className={`min-w-0 rounded-lg px-2 py-3 sm:px-3 ${hi ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                    <div className="text-[10px] font-semibold sm:text-[11px] opacity-80">{t}</div>
                    <div className="mt-1 break-words font-display text-lg font-extrabold tabular-nums sm:text-2xl">{v.toFixed(2).replace(".", ",")} €</div>
                    <p className="mt-1 text-[11px] leading-snug opacity-90 sm:text-xs">{r}</p>
                  </div>
                ))}
              </div>
              <details className="group mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  <span>Marktbegründung · KI-Schätzung</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <p className="pt-2 leading-relaxed">{listing.price_reason}</p>
              </details>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold uppercase text-muted-foreground">Titel</span><CopyBtn text={listing.title} /></div>
              <p className="font-semibold">{listing.title}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold uppercase text-muted-foreground">Beschreibung</span><CopyBtn text={`${listing.description}\n\n${listing.hashtags.join(" ")}`} /></div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"><ShieldCheck className="h-3.5 w-3.5" />{listing.flaws.length ? `${listing.flaws.length} sichtbare Gebrauchsspur${listing.flaws.length > 1 ? "en" : ""}` : "Keine Mängel auf den Fotos erkennbar"}</div>
              <p className="whitespace-pre-line text-sm leading-relaxed">{listing.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {listing.hashtags.map((h) => <span key={h} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{h}</span>)}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Attribute</span>
              <dl className="mt-2 divide-y divide-border">
                {attrs.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="flex items-center gap-1 text-right font-medium">{v}<CopyBtn text={v} label=" " /></dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CopyBtnBig text={fullText} />
              <a href="https://www.vinted.de/items/new" target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-2xl border-2 border-primary py-3.5 font-bold text-primary">Vinted öffnen</a>
            </div>
            <VintedHelper listing={listing} />
          </section>
        )}

        <section className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            [ShieldCheck, "Kein Bann-Risiko", "Keine Bots, kein Login bei Vinted. Du fügst selbst ein."],
            [Sparkles, "Etikett-Erkennung", "Material & Größe direkt vom Waschzettel gelesen."],
            [Coins, "Fair & transparent", "Ab 10 Cent pro Inserat. Kein Abo."],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Camera;
            return (
              <div key={t as string} className="rounded-2xl bg-card p-4 border border-border">
                <Icon className="h-5 w-5 text-primary" />
                <div className="mt-2 font-semibold">{t as string}</div>
                <div className="text-sm text-muted-foreground">{d as string}</div>
              </div>
            );
          })}
        </section>

        <section id="preise" className="mt-12 scroll-mt-20">
          <h2 className="font-display text-2xl font-extrabold">Credits</h2>
          <p className="mt-1 text-sm text-muted-foreground">{FREE} Inserate gratis zum Testen. Danach: 1 Credit = 1 Inserat. Credits verfallen nicht.</p>
          <div className="mt-4 grid gap-3">
            {PACKS.map((p) => (
              <div key={p.n} className={`flex items-center justify-between rounded-2xl border-2 p-4 ${p.best ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div>
                  <div className="flex items-center gap-2 font-bold">{p.n} Inserate {p.best && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">Beliebt</span>}</div>
                  <div className="text-xs text-muted-foreground">{(p.price / p.n * 100).toFixed(1).replace(".", ",")} Cent pro Inserat</div>
                </div>
                <Button onClick={() => toast("Bezahlung folgt in Kürze.")} className="rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background">
                  {p.price.toFixed(2).replace(".", ",")} €
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Transparent: Eine KI-Analyse kostet uns ca. 2–3 Cent. Der Rest deckt Betrieb & Weiterentwicklung.</p>
        </section>
      </main>
    </div>
  );
}

function CopyBtnBig({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      onClick={async () => { try { await copyWithFeedback(text); setOk(true); toast.success("Inserat kopiert – jetzt in Vinted einfügen"); setTimeout(() => setOk(false), 1500); } catch { toast.error("Kopieren nicht möglich. Bitte Text manuell markieren."); } }}
      className="h-auto flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground"
    >
      {ok ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}{ok ? "Kopiert!" : "Alles kopieren"}
    </Button>
  );
}
