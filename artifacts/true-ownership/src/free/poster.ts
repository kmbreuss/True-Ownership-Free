import type { RCState } from "../rcConstants";
import { STOPS } from "./FreeRoad";
import { accountGeneration, accountCacheReady } from "../lib/accountIsolation";

function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (ctx.measureText(word).width > width) {
        if (line) { result.push(line); line = ""; }
        let part = "";
        for (const character of word) {
          if (ctx.measureText(part + character).width > width) { result.push(part); part = ""; }
          part += character;
        }
        line = part;
      } else if (ctx.measureText(line ? `${line} ${word}` : word).width > width) {
        result.push(line); line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    if (line) result.push(line);
  }
  return result;
}
function block(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, size: number, italic = true) {
  if (!text.trim()) return;
  let wrapped: string[] = [];
  for (; size >= 16; size--) {
    ctx.font = `${italic ? "italic " : ""}${size}px "${italic ? "Cormorant Garamond" : "Questrial"}"`;
    wrapped = lines(ctx, text, width);
    if (wrapped.length * size * 1.2 <= height) break;
  }
  if (size < 16) throw new Error("These words are too long for a readable poster. Your full answers are still saved; try a shorter reflection before downloading.");
  wrapped.forEach((line, i) => ctx.fillText(line, x, y + size + i * size * 1.2));
}
export async function saveFutureB(state: RCState, name: string) {
  const generation = accountGeneration();
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image download is unavailable in this browser.");
  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, "#075651"); bg.addColorStop(.45, "#005451"); bg.addColorStop(1, "#002b2a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "#d9c997"; ctx.textAlign = "center";
  ctx.font = '22px "Questrial"'; ctx.fillText("M Y   F U T U R E   B", 540, 100);
  const date = new Date(state.completedAt ?? state.startedAt ?? Date.now());
  block(ctx, [name.trim(), date.toLocaleDateString("en-US", { month: "long", year: "numeric" })].filter(Boolean).join(" · "), 540, 115, 920, 90, 34);
  // Existing words only: one-year letter becomes the headline, B Tuesday the subline.
  block(ctx, state.futureB1.doing.trim() ? `“${state.futureB1.doing.trim()}”` : "", 540, 210, 930, 230, 76);
  block(ctx, state.futureB5.tuesday, 540, 470, 900, 125, 34);
  const glow = ctx.createRadialGradient(800, 695, 0, 800, 695, 235);
  glow.addColorStop(0, "#fffbdfe0"); glow.addColorStop(.35, "#ead78eaa"); glow.addColorStop(1, "#ead78e00");
  ctx.fillStyle = glow; ctx.fillRect(550, 450, 520, 500);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M535 1670 C620 1590 945 1570 870 1410 S600 1260 700 1125 S940 1010 840 850 S785 755 800 695");
  ctx.strokeStyle = "#d6c79040"; ctx.lineWidth = 48;
  ctx.stroke(new Path2D(path.getAttribute("d")!));
  const length = path.getTotalLength();
  for (let d = 12; d < length - 10; d += 32) {
    const p = path.getPointAtLength(d), q = path.getPointAtLength(Math.min(length, d + 3));
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(q.y - p.y, q.x - p.x));
    ctx.fillStyle = "#dbc98e"; ctx.fillRect(-12, -17, 24, 34); ctx.restore();
  }
  const old = new Path2D("M525 1670 C330 1615 160 1650 135 1480");
  ctx.strokeStyle = "#ba9b9c66"; ctx.lineWidth = 16; ctx.setLineDash([1, 18]); ctx.lineCap = "round"; ctx.stroke(old); ctx.setLineDash([]);
  ctx.fillStyle = "#fffde9"; ctx.font = "75px serif"; ctx.fillText("★", 800, 718);
  const positions = [.12, .31, .50, .69, .87].map(fraction => {
    const point = path.getPointAtLength(length * fraction);
    return [point.x, point.y];
  });
  positions.forEach(([x, y], i) => {
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = "#003c39"; ctx.fill(); ctx.strokeStyle = "#edda9f"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#d9c997"; ctx.textAlign = "right"; ctx.font = '21px "Questrial"';
    ctx.fillText(`${STOPS[i][0]} · ${STOPS[i][1].toUpperCase()}`, x - 45, y - 5);
    block(ctx, STOPS[i][2], x - 45, y + 3, 450, 90, 28);
  });
  ctx.textAlign = "left"; ctx.fillStyle = "#bda8a0"; ctx.font = '20px "Questrial"'; ctx.fillText("THE OLD ROAD", 55, 1380);
  const cost = [
    state.cost.hoursPerWeek !== null ? `${state.cost.hoursPerWeek} hours a week` : "",
    state.cost.monthly !== null ? `$${state.cost.monthly} a month` : "", state.cost.you,
  ].filter(Boolean).join(" · ");
  block(ctx, cost, 55, 1395, 220, 150, 26);
  ctx.beginPath(); ctx.arc(535, 1670, 23, 0, Math.PI * 2); ctx.fillStyle = "#e5cc85"; ctx.fill(); ctx.strokeStyle = "#fffbea"; ctx.lineWidth = 4; ctx.stroke();
  ctx.textAlign = "center"; ctx.fillStyle = "#e0d3a6";
  block(ctx, ["Step one is done.", state.futureB1.oneThing.trim() ? `This week I start with ${state.futureB1.oneThing.trim()}` : ""].filter(Boolean).join(" "), 540, 1725, 950, 100, 34);
  ctx.fillStyle = "#dbc486"; ctx.beginPath(); ctx.roundRect(175, 1850, 730, 50, 25); ctx.fill();
  ctx.fillStyle = "#153c37"; ctx.font = '24px "Questrial"'; ctx.fillText("My road opens soon · true-ownership.com", 540, 1883);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not create your poster.")), "image/png"));
  if (generation !== accountGeneration() || !accountCacheReady()) throw new Error("Account changed. Reload before downloading.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "My-Future-B.png"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
