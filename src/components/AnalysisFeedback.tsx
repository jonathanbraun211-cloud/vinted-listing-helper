import { useEffect, useState } from "react";
import { Check, Loader2, ScanLine, Tag, Coins, Sparkles } from "lucide-react";

const steps = [
  [ScanLine, "Analysiere Schnitt & Modell…"],
  [Tag, "Lese Waschetikett & Material…"],
  [Coins, "Schätze Marktpreise & Nachfrage…"],
  [Sparkles, "Formuliere SEO-Titel & Beschreibung…"],
] as const;

export function AnalysisFeedback() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, steps.length - 1)), 3500);
    return () => clearInterval(timer);
  }, []);
  return <section className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300" aria-label="Analysefortschritt">
    <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Dein Inserat entsteht</span><span className="text-xs text-primary">KI arbeitet</span></div>
    <ol className="space-y-3">{steps.map(([Icon, text], index) => <li key={text} className={`flex items-center gap-3 text-sm transition-colors motion-reduce:transition-none ${index <= step ? "text-foreground" : "text-muted-foreground"}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">{index === step ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : index < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>{text}
    </li>)}</ol>
    <p role="status" aria-live="polite" className="sr-only">{steps[step][1]}</p>
    <p className="mt-3 text-[11px] text-muted-foreground">Ablaufanzeige, kein Live-Protokoll · Preise sind KI-Schätzungen, kein Vinted-Liveabgleich.</p>
  </section>;
}