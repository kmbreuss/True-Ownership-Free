import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { isDevPreview } from "../devPreview";
import "./appearance.css";

type Preference = "light" | "dark" | "system";
type Theme = "light" | "dark";
type Appearance = { preference: Preference; theme: Theme; choose: (preference: Preference) => void };
const Context = createContext<Appearance | null>(null);
const STORAGE_KEY = "na1_theme";

function savedPreference(): Preference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* Storage may be unavailable. Match the device without writing. */ }
  return "system";
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Preference>(savedPreference);
  const [deviceDark, setDeviceDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme: Theme = preference === "system" ? deviceDark ? "dark" : "light" : preference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDeviceDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setPreference(savedPreference());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  const choose = useCallback((next: Preference) => {
    setPreference(next);
    try {
      if (!isDevPreview()) localStorage.setItem(STORAGE_KEY, next);
    } catch { /* The current session still works if persistence is blocked. */ }
  }, []);
  return <Context.Provider value={{ preference, theme, choose }}>{children}</Context.Provider>;
}

export function useAppearance() {
  const appearance = useContext(Context);
  if (!appearance) throw new Error("Appearance controls require AppearanceProvider");
  return appearance;
}

export function HomeAppearanceButton() {
  const { theme, choose } = useAppearance();
  const action = theme === "dark" ? "Switch to light" : "Switch to dark";
  return <div className="appearance-home-row">
    <button className="appearance-home-button" type="button" aria-label={action} title={action}
      onClick={() => choose(theme === "dark" ? "light" : "dark")}>
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
    </button>
  </div>;
}

export function AppearanceOptions() {
  const { preference, choose } = useAppearance();
  const name = useId();
  return <fieldset className="appearance-options">
    <legend>Appearance</legend>
    <div className="appearance-options-row">
      {(["light", "dark", "system"] as const).map(option => <label className="appearance-option" key={option}>
        <input type="radio" name={name} value={option} checked={preference === option} onChange={() => choose(option)}/>
        <span>{option === "system" ? "Match my phone" : option === "light" ? "Light" : "Dark"}</span>
      </label>)}
    </div>
  </fieldset>;
}
