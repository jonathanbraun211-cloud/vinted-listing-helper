export async function copyWithFeedback(text: string) {
  await navigator.clipboard.writeText(text);
  if (typeof navigator.vibrate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    try { navigator.vibrate(20); } catch { /* Haptics are optional. */ }
  }
}