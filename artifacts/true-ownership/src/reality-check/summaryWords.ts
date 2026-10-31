/** Presentation only: never rewrite the owner's saved answer. */
export function summaryInYou(text: string): string {
  const parts = text.trim().replace(/[.!?…;,\s]+$/u, "")
    .split(/(?:[.!?…;]+(?=\s|$)|,(?!\d)|\n|\s+and\s+)/iu)
    .map(part => part.trim().toLowerCase()).filter(Boolean);
  return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}
