export function hasNotes(src: string | null | undefined): boolean {
  return typeof src === "string" && src.trim().length > 0;
}
