/** Conservative global corrections only: no retouching, denoising or detail removal. */
export function boostPixels(source: Uint8ClampedArray): Uint8ClampedArray {
  const result = new Uint8ClampedArray(source);
  let sum = 0, count = 0, neutralCount = 0;
  const channels: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < source.length; i += 4) {
    if (source[i + 3] === 0) continue;
    const r = source[i] ?? 0, g = source[i + 1] ?? 0, b = source[i + 2] ?? 0;
    const light = .2126 * r + .7152 * g + .0722 * b;
    sum += light; count++;
    // Correct warmth only when near-neutral, bright reference pixels exist.
    if (light > 100 && light < 245 && Math.max(r, g, b) - Math.min(r, g, b) < 45) {
      channels[0] += r; channels[1] += g; channels[2] += b; neutralCount++;
    }
  }
  if (!count) return result;
  const mean = sum / count;
  const gamma = mean < 150 ? Math.max(.78, 1 - (150 - mean) / 500) : 1;
  const neutralMean = channels.reduce((a, b) => a + b, 0) / 3;
  const gains = channels.map((c) => neutralCount >= Math.max(20, count * .02) && c > 0
    ? Math.min(1.06, Math.max(.94, neutralMean / c)) : 1);
  const contrast = mean < 150 ? 1.025 : 1;
  for (let i = 0; i < source.length; i += 4) {
    if (source[i + 3] === 0) continue;
    for (let c = 0; c < 3; c++) {
      const balanced = Math.min(255, (source[i + c] ?? 0) * (gains[c] ?? 1));
      const lit = 255 * Math.pow(balanced / 255, gamma);
      result[i + c] = Math.round(Math.min(255, Math.max(0, (lit - 128) * contrast + 128)));
    }
  }
  return result;
}

export async function boostPhoto(source: string): Promise<string> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Foto konnte nicht geöffnet werden."));
    img.src = source;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto-Booster ist hier nicht verfügbar.");
  context.drawImage(img, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  pixels.data.set(boostPixels(pixels.data));
  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL("image/jpeg", .92);
}