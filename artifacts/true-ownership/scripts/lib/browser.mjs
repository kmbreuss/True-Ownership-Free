import { chromium } from "playwright";
// Local Mac: use the installed Google Chrome. On Replit, CHROMIUM_PATH points at its own build.
export function launch() {
  return chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox"],
  });
}
