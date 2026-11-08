import type { ShareCardData } from "./PictureMap";

/** Local download only: no upload, public URL, or account mutation. */
export async function downloadMapCard(data: ShareCardData) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create the card. Please try another browser.");
  const width = 900, inset = 76, textWidth = width - inset * 2;
  const bodyFont = getComputedStyle(document.documentElement).getPropertyValue("--f-body").trim() || '"Cormorant Garamond", Georgia, serif';
  const labelFont = getComputedStyle(document.documentElement).getPropertyValue("--f-label").trim() || "sans-serif";
  type Block = { label: string; text: string; size: number; italic?: boolean };
  const blocks: Block[] = [
    { label: "MAP OF ME™", text: data.name || "Map of Me", size: 68, italic: true },
    ...(data.future ? [{ label: "MY FUTURE B", text: data.future, size: 43, italic: true }] : []),
    ...(data.values.length ? [{ label: "WHAT I STAND FOR", text: data.values.map((value, i) => `${i + 1}  ${value}`).join("\n"), size: 40 }] : []),
    ...(data.creatures.length ? [{ label: "WHO I AM", text: data.creatures.join("\n"), size: 34 }] : []),
    ...(data.why ? [{ label: "MY WHY", text: data.why, size: 43, italic: true }] : []),
  ];
  const wrap = (text: string, size: number, italic = false) => {
    ctx.font = `${italic ? "italic " : ""}${size}px ${bodyFont}`;
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (ctx.measureText(`${line}${line ? " " : ""}${word}`).width <= textWidth) { line += `${line ? " " : ""}${word}`; continue; }
        if (line) lines.push(line);
        line = "";
        for (const character of Array.from(word)) {
          if (line && ctx.measureText(line + character).width > textWidth) { lines.push(line); line = ""; }
          line += character;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  };
  const laidOut = blocks.map(block => ({ ...block, lines: wrap(block.text, block.size, block.italic) }));
  const height = Math.max(1200, 150 + laidOut.reduce((sum, block) => sum + 64 + block.lines.length * block.size * 1.35, 0));
  if (height > 14000) throw new Error("These answers are too long for a single image. Download the full PDF instead.");
  canvas.width = width; canvas.height = Math.ceil(height);
  const gradient = ctx.createRadialGradient(300, 0, 40, 450, height / 2, height);
  gradient.addColorStop(0, "#036360"); gradient.addColorStop(.5, "#024845"); gradient.addColorStop(1, "#012325");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#A5875E"; ctx.lineWidth = 2; ctx.strokeRect(28, 28, width - 56, height - 56);
  let y = 100; ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (const block of laidOut) {
    ctx.fillStyle = "#CDB48E"; ctx.font = `20px ${labelFont}`; ctx.fillText(block.label, width / 2, y); y += 38;
    ctx.fillStyle = "#EFE6D6"; ctx.font = `${block.italic ? "italic " : ""}${block.size}px ${bodyFont}`;
    for (const line of block.lines) { ctx.fillText(line, width / 2, y); y += block.size * 1.35; }
    y += 26;
  }
  ctx.fillStyle = "#CDB48E"; ctx.font = `17px ${labelFont}`; ctx.fillText("TRUE OWNERSHIP™", width / 2, height - 75);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Your card could not be created. Please try again.")), "image/png"));
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = "my-map-of-me.png"; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
