import lightThemeUrl from "primereact/resources/themes/lara-light-blue/theme.css?url";
import darkThemeUrl from "primereact/resources/themes/lara-dark-blue/theme.css?url";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const THEME_LINK_ID = "prime-theme";

/** Swap Lara light/dark stylesheet (PrimeReact 10 styled mode). */
export function applyPrimeTheme(isDark: boolean) {
  let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = THEME_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = isDark ? darkThemeUrl : lightThemeUrl;
}
