import { useRef, useState } from "react";
import { Camera, Check, Download, Loader2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { boostPhoto } from "@/lib/photo-booster";

async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Bild konnte nicht verarbeitet werden.");
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", .9);
  } finally { URL.revokeObjectURL(url); }
}

export function PhotoSlot({ label, icon: Icon, value, onChange, onOriginalChange, disabled }: {
  label: string; icon: typeof Camera; value: string | undefined; onChange: (value?: string) => void; onOriginalChange: (value?: string) => void; disabled: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const [drag, setDrag] = useState(false);
  const [boosted, setBoosted] = useState<string>();
  const [original, setOriginal] = useState<string>();
  const [after, setAfter] = useState(false);
  const [used, setUsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const take = async (file?: File) => {
    if (disabled || busy || !file) return;
    if (!file.type.startsWith("image/")) { toast.error("Bitte ein Foto auswählen."); return; }
    const id = ++generation.current;
    setBusy(true); setBoosted(undefined); setAfter(false); setUsed(false);
    try { const photo = await compress(file); if (id === generation.current) { setOriginal(photo); onOriginalChange(photo); onChange(photo); } }
    catch { toast.error("Foto konnte nicht geladen werden."); }
    finally { if (id === generation.current) setBusy(false); }
  };
  const boost = async () => {
    if (!original) return;
    const id = generation.current;
    setBusy(true);
    try { const photo = await boostPhoto(original); if (id === generation.current) { setBoosted(photo); setAfter(true); } }
    catch { toast.error("Foto konnte nicht optimiert werden."); }
    finally { if (id === generation.current) setBusy(false); }
  };
  const remove = () => { generation.current++; onChange(undefined); onOriginalChange(undefined); setOriginal(undefined); setBoosted(undefined); setAfter(false); setUsed(false); setBusy(false); if (ref.current) ref.current.value = ""; };
  return (
    <div className="min-w-0 space-y-2">
      <div onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void take(e.dataTransfer.files[0]); }}
        className={`relative aspect-[3/4] overflow-hidden rounded-2xl border-2 ${value ? "border-border" : "border-dashed"} ${drag ? "border-primary bg-primary/10" : "bg-card"}`}>
        {value ? <>
          <img src={after && boosted ? boosted : original ?? value} alt={`${label} · ${after ? "Nachher" : "Vorher"}`} className="h-full w-full object-contain" />
          <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-1 text-[10px] font-semibold">{after ? "Nachher" : "Original"}</span>
          <Button variant="secondary" size="icon" disabled={disabled} onClick={remove} aria-label={`${label} entfernen`} title="Foto entfernen" className="absolute right-2 top-2 h-7 w-7"><X /></Button>
        </> : <Button variant="ghost" disabled={disabled || busy} onClick={() => ref.current?.click()} className="h-full w-full flex-col whitespace-normal rounded-none p-3">
          <span className="rounded-full bg-primary/10 p-3 text-primary">{busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}</span>
          <span className="text-sm font-semibold">{label}</span><span className="text-xs text-muted-foreground">Tippen oder ziehen</span>
        </Button>}
        <input ref={ref} type="file" aria-label={`${label} hochladen`} accept="image/*" capture="environment" disabled={disabled || busy} className="hidden" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {value && <>
        {!boosted ? <Button variant="secondary" className="w-full" disabled={busy || disabled} onClick={boost}>{busy ? <Loader2 className="animate-spin" /> : <Wand2 />}Foto-Booster</Button> : <>
          <div className="grid grid-cols-2 rounded-md bg-secondary p-1" role="group" aria-label={`${label} Fotovergleich`}>
            <Button size="sm" variant={after ? "ghost" : "default"} onClick={() => setAfter(false)} aria-pressed={!after}>Vorher</Button>
            <Button size="sm" variant={after ? "default" : "ghost"} onClick={() => setAfter(true)} aria-pressed={after}>Nachher</Button>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={disabled} className="min-w-0 flex-1 px-2" aria-pressed={used} onClick={() => { onChange(used ? original : boosted); setUsed(!used); setAfter(!used); }}>{used ? <Check /> : <Wand2 />}{used ? "Verwendet" : "Verwenden"}</Button>
            <Button asChild variant="secondary" size="icon"><a href={boosted} download={`kleidr-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-optimiert.jpg`} aria-label={`${label} optimiert herunterladen`} title="Optimiertes Foto herunterladen"><Download /></a></Button>
          </div>
          {used && <p className="text-[11px] leading-snug text-muted-foreground">Optimiertes Verkaufsfoto ausgewählt. Für die Zustandserkennung bleibt das Original erhalten.</p>}
        </>}
      </>}
    </div>
  );
}