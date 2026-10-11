import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Check, ChevronDown, Copy, Wand2 } from "lucide-react";
import type { Listing } from "@/lib/analyze.functions";
import { Button } from "@/components/ui/button";
import { copyWithFeedback } from "@/lib/copy-feedback";

const MARK = "KLEIDR::";

// Runs only in the user's own browser on the Vinted page: reads clipboard, fills fields like manual pasting.
const SRC = `(async()=>{const M="${MARK}";let t="";try{t=await navigator.clipboard.readText()}catch(e){}if(!t||t.indexOf(M)!==0){t=prompt("kleidr: Bitte hier einfügen (lange tippen → Einfügen)")||""}if(t.indexOf(M)!==0){alert("kleidr: Keine Inserat-Daten gefunden. Erst in kleidr auf „Für Vinted kopieren“ tippen.");return}let d;try{d=JSON.parse(decodeURIComponent(escape(atob(t.slice(M.length)))))}catch(e){alert("kleidr: Daten beschädigt.");return}const q=s=>document.querySelector(s);const f=(el,v)=>{if(!el)return 0;const p=Object.getPrototypeOf(el);const st=Object.getOwnPropertyDescriptor(p,"value").set;st.call(el,v);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return 1};let n=0;n+=f(q("#title,input[name=title],[data-testid=title--input]"),d.t);n+=f(q("#description,textarea[name=description],[data-testid=description--input]"),d.d);n+=f(q("#price,input[name=price],[data-testid=price-input--input]"),d.p);alert(n?"kleidr: "+n+" Felder ausgefüllt ✓ Bitte Fotos, Kategorie, Marke, Größe und Zustand noch auswählen.":"kleidr: Keine Felder gefunden. Bist du auf der Seite „Artikel verkaufen“?")})()`;
const BOOKMARKLET = "javascript:" + encodeURIComponent(SRC);

function encode(l: Listing) {
  const json = JSON.stringify({
    t: l.title,
    d: `${l.description}\n\n${l.hashtags.join(" ")}`,
    p: l.price_suggested.toFixed(2).replace(".", ","),
  });
  return MARK + btoa(unescape(encodeURIComponent(json)));
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</span>
      <div className="text-sm leading-relaxed">{children}</div>
    </li>
  );
}

export function VintedHelper({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"iphone" | "android" | "pc">("iphone");
  const [codeOk, setCodeOk] = useState(false);
  const [listingOk, setListingOk] = useState(false);

  const copyListing = async () => {
    try {
      await copyWithFeedback(encode(listing));
      setListingOk(true); setTimeout(() => setListingOk(false), 1500);
      toast.success("Kopiert! Jetzt Vinted öffnen und das Lesezeichen „kleidr“ antippen.");
    } catch { toast.error("Kopieren nicht möglich. Bitte die einzelnen Texte manuell markieren."); }
  };
  const copyCode = async () => {
    try {
      await copyWithFeedback(BOOKMARKLET);
      setCodeOk(true); setTimeout(() => setCodeOk(false), 1500);
    } catch { toast.error("Kopieren nicht möglich. Bitte Zwischenablage im Browser erlauben."); }
  };

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-card p-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-bold">1-Klick zu Vinted</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Titel, Beschreibung und Optimalpreis werden auf Vinted automatisch eingetragen – ohne Bot, ohne Login, ohne Bann-Risiko.</p>

      <Button onClick={copyListing} className="mt-3 h-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground">
        {listingOk ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{listingOk ? "Kopiert!" : "Für Vinted kopieren"}
      </Button>
      <ol className="mt-3 space-y-2 text-sm">
        <Step n={1}>Oben auf <b>„Für Vinted kopieren“</b> tippen.</Step>
        <Step n={2}>Auf Vinted <b>„Artikel verkaufen“</b> öffnen (im Browser, nicht in der App).</Step>
        <Step n={3}>Dein Lesezeichen <b>„kleidr“</b> antippen. Falls gefragt: <b>„Einfügen“</b> erlauben.</Step>
        <Step n={4}>Fotos hochladen, Kategorie, Marke, Größe & Zustand auswählen (Werte siehe „Attribute“ oben) – fertig.</Step>
      </ol>

      <button onClick={() => setOpen(!open)} className="mt-4 flex w-full items-center justify-between rounded-xl bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground">
        <span className="flex items-center gap-2"><Bookmark className="h-4 w-4" />Einmalig einrichten: Lesezeichen anlegen</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Das Lesezeichen ist ein kleiner Helfer, der nur in deinem Browser läuft. Er macht genau das, was du sonst per Hand machst: Einfügen. Du richtest es nur ein einziges Mal ein.</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-xs font-semibold">
            {([["iphone", "iPhone (Safari)"], ["android", "Android (Chrome)"], ["pc", "Computer"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-lg py-2 ${tab === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>{l}</button>
            ))}
          </div>

          {tab !== "pc" && (
            <button onClick={copyCode} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary py-2.5 text-sm font-bold text-primary">
              {codeOk ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{codeOk ? "Helfer-Code kopiert" : "Helfer-Code kopieren"}
            </button>
          )}

          {tab === "iphone" && (
            <ol className="space-y-2">
              <Step n={1}>Tippe oben auf <b>„Helfer-Code kopieren“</b>.</Step>
              <Step n={2}>Tippe in Safari unten auf das <b>Teilen-Symbol</b> (Quadrat mit Pfeil) → <b>„Lesezeichen hinzufügen“</b> → <b>Sichern</b>.</Step>
              <Step n={3}>Öffne die Lesezeichen (Buch-Symbol) → <b>„Bearbeiten“</b> → tippe auf das neue Lesezeichen.</Step>
              <Step n={4}>Ändere den Namen in <b>kleidr</b>. Lösche die Adresse komplett, halte den Finger ins leere Feld → <b>„Einfügen“</b> → <b>Fertig</b>.</Step>
            </ol>
          )}
          {tab === "android" && (
            <ol className="space-y-2">
              <Step n={1}>Tippe oben auf <b>„Helfer-Code kopieren“</b>.</Step>
              <Step n={2}>In Chrome oben rechts auf <b>⋮</b> → auf den <b>Stern ☆</b> tippen. Unten erscheint „Bearbeiten“ – antippen.</Step>
              <Step n={3}>Namen auf <b>kleidr</b> ändern. Die URL komplett löschen und den kopierten Code <b>einfügen</b>. Zurück tippen zum Speichern.</Step>
              <Step n={4}>Auf Vinted benutzen: In die <b>Adressleiste</b> tippen, <b>kleidr</b> eintippen und den Vorschlag mit dem Stern-Symbol antippen.</Step>
            </ol>
          )}
          {tab === "pc" && (
            <ol className="space-y-2">
              <Step n={1}>Lesezeichenleiste einblenden: <b>Strg+Umschalt+B</b> (Mac: <b>⌘+Umschalt+B</b>).</Step>
              <Step n={2}>
                Ziehe diesen Knopf mit der Maus in die Lesezeichenleiste:{" "}
                <a
                  href={BOOKMARKLET}
                  onClick={(e) => { e.preventDefault(); toast.info("Nicht klicken – mit der Maus in die Lesezeichenleiste ziehen."); }}
                  className="ml-1 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                >
                  <Bookmark className="h-3.5 w-3.5" />kleidr
                </a>
              </Step>
              <Step n={3}>Fertig. Auf Vinted bei „Artikel verkaufen“ einfach auf <b>kleidr</b> in der Leiste klicken.</Step>
            </ol>
          )}
          <p className="text-xs text-muted-foreground">Hinweis: Der Helfer funktioniert im Browser auf vinted.de, nicht in der Vinted-App. Fotos und Auswahlfelder (Kategorie, Marke, Größe, Zustand) wählst du selbst – so bleibt alles 100 % sicher.</p>
        </div>
      )}
    </div>
  );
}
