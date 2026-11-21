import { el } from "./dom";

const MEASUREMENT_ID = "G-Y4ZYTKJ10V";
const CONSENT_KEY = "de-crash-course-analytics-consent";
const COOKIE_PREFIX = "de_crash_course";
const DISABLE_FLAG = "ga-disable-G-Y4ZYTKJ10V";
type Choice = "accepted" | "declined";

declare global {
  interface Window {
    dataLayer?: unknown[];
    "ga-disable-G-Y4ZYTKJ10V"?: boolean;
  }
}

function queue(..._commands: unknown[]): void {
  (window.dataLayer ??= []).push(arguments);
}

function clearAnalyticsCookies(): void {
  const names = document.cookie.split(";").map(cookie => cookie.trim().split("=")[0])
    .filter(name => name.startsWith(`${COOKIE_PREFIX}_ga`));
  for (const name of names) {
    for (const domain of ["", window.location.hostname, `.${window.location.hostname}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=${import.meta.env.BASE_URL}; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}

export function initAnalytics(): void {
  const site = new URL(import.meta.env.VITE_SITE_URL);
  if (!import.meta.env.PROD || window.location.origin !== site.origin
    || !window.location.pathname.startsWith(site.pathname)
    || document.getElementById("analytics-consent")) return;

  const preferenceControl = document.getElementById("analytics-preferences");
  const statusControl = document.getElementById("analytics-status");
  if (!preferenceControl || !statusControl) throw new Error("Analytics footer controls are missing.");
  const preferences = preferenceControl;
  const status = statusControl;
  preferences.hidden = false;

  const panel = el("section", {
    className: "analytics-consent",
    attrs: { id: "analytics-consent", role: "region", "aria-labelledby": "analytics-consent-title" },
  });
  const heading = el("h2", {
    text: "Optional analytics",
    attrs: { id: "analytics-consent-title", tabindex: "-1" },
  });
  panel.appendChild(heading);
  panel.appendChild(el("p", {
    text: "Google Analytics uses cookies to measure page views, traffic sources, and engagement. Analytics stays off unless you accept. Your choice is saved in this browser.",
  }));
  const details = el("details", { className: "analytics-privacy-details" });
  details.appendChild(el("summary", { text: "Privacy details" }));
  details.appendChild(el("p", {
    text: "Google receives page URLs, referrers, browser/device information, and cookie-based identifiers, and can derive approximate location. Analytics cookies can last up to two years, subject to browser limits. Advertising features are disabled. This site does not send reading progress, search text, or feedback content. Change your choice in the footer; withdrawing consent reloads this page and removes this site's analytics cookies.",
  }));
  details.appendChild(el("a", {
    text: "How Google uses information",
    attrs: {
      href: "https://policies.google.com/technologies/partner-sites",
      target: "_blank", rel: "noopener noreferrer",
    },
  }));
  panel.appendChild(details);
  const errorMessage = el("p", { className: "analytics-consent-error", attrs: { role: "alert" } });
  errorMessage.hidden = true;
  panel.appendChild(errorMessage);
  const actions = el("div", { className: "analytics-consent-actions" });
  const accept = el("button", { text: "Accept", attrs: { type: "button", "aria-label": "Accept analytics" } });
  const decline = el("button", { text: "Decline", attrs: { type: "button", "aria-label": "Decline analytics" } });
  const close = el("button", { text: "Close", attrs: { type: "button" } });
  actions.append(accept, decline, close);
  panel.appendChild(actions);
  document.body.appendChild(panel);

  let choice: Choice | null = null;
  let started = false;
  let configured = false;
  let openedFromFooter = false;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") choice = stored;
    else if (stored !== null) throw new Error("Invalid saved analytics preference.");
  } catch (error) {
    console.error("Unable to read analytics consent.", error);
    errorMessage.textContent = "Your saved preference could not be read. Analytics is off; choose again to save a preference.";
    errorMessage.hidden = false;
  }

  function enable(): void {
    if (started) return;
    started = true;
    window[DISABLE_FLAG] = false;
    if (!configured) {
      const deniedAds = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
      queue("consent", "default", { ...deniedAds, analytics_storage: "denied" });
      const settings = {
        cookie_prefix: COOKIE_PREFIX,
        cookie_domain: "none",
        cookie_path: import.meta.env.BASE_URL,
        cookie_flags: "SameSite=Lax;Secure",
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      };
      // Apply cookie scope before granting consent to avoid default root cookies.
      queue("set", settings);
      queue("consent", "update", { ...deniedAds, analytics_storage: "granted" });
      queue("js", new Date());
      queue("config", MEASUREMENT_ID, {
        ...settings,
        send_page_view: true,
      });
      configured = true;
    }
    const script = el("script", {
      attrs: {
        id: "analytics-tag",
        src: `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`,
      },
    });
    script.async = true;
    script.addEventListener("error", () => {
      script.remove();
      started = false;
      window[DISABLE_FLAG] = true;
      console.warn("Google Analytics could not load.");
      status.textContent = "Analytics is unavailable. Retry using Privacy & analytics.";
      status.hidden = false;
    });
    script.addEventListener("load", () => { status.hidden = true; });
    document.head.appendChild(script);
  }

  function disable(): void {
    started = false;
    window[DISABLE_FLAG] = true;
    clearAnalyticsCookies();
    document.getElementById("analytics-tag")?.remove();
  }

  function hide(): void {
    panel.hidden = true;
    if (openedFromFooter) preferences.focus();
    openedFromFooter = false;
  }

  function save(next: Choice): void {
    if (next === "declined") disable();
    try {
      localStorage.setItem(CONSENT_KEY, next);
    } catch (error) {
      disable();
      console.error("Unable to save analytics consent.", error);
      errorMessage.textContent = "Your preference could not be saved. Analytics is disabled on this page; enable site storage or clear saved site data before trying again.";
      errorMessage.hidden = false;
      return;
    }
    choice = next;
    errorMessage.hidden = true;
    close.hidden = false;
    hide();
    if (next === "accepted") enable();
    else if (configured) window.location.reload();
  }

  accept.addEventListener("click", () => save("accepted"));
  decline.addEventListener("click", () => save("declined"));
  close.addEventListener("click", hide);
  preferences.addEventListener("click", () => {
    openedFromFooter = true;
    panel.hidden = false;
    close.hidden = choice === null;
    heading.focus();
  });
  window.addEventListener("storage", event => {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    if (configured) {
      disable();
      window.location.reload();
    } else {
      const next = event.key === null ? null : event.newValue;
      choice = next === "accepted" || next === "declined" ? next : null;
      panel.hidden = choice !== null;
      close.hidden = choice === null;
      if (choice === "accepted") enable();
    }
  });
  panel.hidden = choice !== null;
  close.hidden = choice === null;
  if (choice === "accepted") enable();
  else disable();
}
