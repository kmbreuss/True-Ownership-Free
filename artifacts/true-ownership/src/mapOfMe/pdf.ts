import type { MapModel } from "./MapOfMe";
import { STAGES, type MapSection } from "./model";

/** Export exactly the full-answer projection shown in the panels, not a second legacy reader. */
export async function downloadMapPDF(model: MapModel, sections: MapSection[], loadPDF: () => Promise<any>) {
  const PDF = await loadPDF();
  const doc = new PDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight();
  const margin = 42, usable = width - margin * 2;
  let y = margin;
  const newPage = () => { doc.addPage(); y = margin; };
  const write = (value: string, size = 12, color = "#353334", bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(color);
    // The browser's font fallback renders emoji and non-WinAnsi scripts without dropping the member's characters.
    const unicode = /[^\u0009\u000A\u000D\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/u.test(value);
    const lineHeight = size * 1.45;
    let lines: string[] = doc.splitTextToSize(value || " ", usable);
    if (unicode) {
      const measure = document.createElement("canvas").getContext("2d");
      if (!measure) throw new Error("Your browser could not render this PDF.");
      measure.font = `${bold ? "bold " : ""}${size}px sans-serif`;
      const Segmenter = (Intl as any).Segmenter;
      const segments = (s: string): string[] => Segmenter
        ? Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(s), (part: any) => part.segment)
        : Array.from(s);
      lines = [];
      for (const paragraph of value.split(/\r?\n/)) {
        let current = "";
        for (const word of paragraph.match(/\S+\s*|\s+/gu) || [""]) {
          if (current && measure.measureText(current + word).width > usable) { lines.push(current); current = ""; }
          for (const glyph of segments(word)) {
            if (current && measure.measureText(current + glyph).width > usable) { lines.push(current); current = ""; }
            current += glyph;
          }
        }
        lines.push(current);
      }
    }
    for (const line of lines) {
      if (y + lineHeight > height - margin - 18) newPage();
      if (unicode) {
        const canvas = document.createElement("canvas"), scale = 3;
        canvas.width = Math.ceil(usable * scale); canvas.height = Math.ceil(lineHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Your browser could not render this PDF.");
        ctx.scale(scale, scale); ctx.font = `${bold ? "bold " : ""}${size}px sans-serif`;
        ctx.fillStyle = color; ctx.textBaseline = "alphabetic"; ctx.fillText(line, 0, size);
        doc.addImage(canvas.toDataURL("image/png"), "PNG", margin, y - size, usable, lineHeight);
      } else doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 5;
  };
  doc.setProperties({ title: model.title, subject: "My Map of Me · saved answers", creator: "True Ownership" });
  write(model.title, 21, "#00645F", true);
  write(`As of ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 10, "#735F43");
  for (const stage of STAGES) {
    y += 8;
    if (y > height - margin - 85) newPage();
    write(stage.title, 16, "#00645F", true);
    const rows = sections.filter(section => section.stage === stage.id);
    if (!rows.length) write(`Fills in after ${stage.id.toUpperCase()}`, 11, "#735F43");
    for (const section of rows) {
      if (y > height - margin - 75) newPage();
      write(section.title, 13, "#735F43", true);
      if (!section.answers.length) write(section.empty, 11, "#666666");
      for (const item of section.answers) {
        write(item.label, 10, "#666666", true);
        write(item.text, 12);
      }
      y += 6;
    }
  }
  const pages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor("#666666");
    doc.text(`${page} / ${pages}`, width - margin, height - 22, { align: "right" });
  }
  const filename = model.title.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-|-$/g, "") || "My-Map-of-Me";
  doc.save(`${filename}.pdf`);
}
