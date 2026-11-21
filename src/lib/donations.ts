import { courses } from "../content";
import { el } from "./dom";
import { icon } from "./icons";
import { overallProgress, PROGRESS_CHANGED_EVENT } from "./progress";

// Temporary public preview requested for testing. Set false to use milestones.
export const DONATION_TEST_MODE = true;
const MILESTONES: readonly number[] = [25, 50, 75, 100];
const STORAGE_KEY = "de-crash-course-donation-milestones";

function readMilestones(): Set<number> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return new Set();
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every((value: unknown): value is number =>
    typeof value === "number" && MILESTONES.includes(value))) {
    throw new Error("Invalid saved donation milestones.");
  }
  return new Set(parsed);
}

export function initDonationPrompts(testMode = DONATION_TEST_MODE): void {
  if (import.meta.env.SSR || document.getElementById("donation-popup")) return;
  const footerLink = document.querySelector<HTMLAnchorElement>("#venmo-support");
  const statusControl = document.getElementById("donation-status");
  if (!footerLink || !statusControl) throw new Error("Donation footer controls are missing.");
  const status = statusControl;

  const popup = el("section", {
    className: "donation-popup",
    attrs: { id: "donation-popup", role: "region", "aria-labelledby": "donation-popup-title" },
  });
  popup.hidden = true;
  const header = el("div", { className: "donation-popup-header" });
  const title = el("h2", { attrs: { id: "donation-popup-title" } });
  const close = el("button", {
    className: "donation-popup-close",
    attrs: { type: "button", "aria-label": "Dismiss donation reminder" },
  });
  close.appendChild(icon("close"));
  header.append(title, close);
  popup.appendChild(header);
  popup.appendChild(el("p", {
    text: "If these notes have helped with your prep, you can support the site via Venmo. It's entirely optional.",
  }));
  popup.appendChild(el("a", {
    className: "donation-support-link",
    text: "Support via Venmo",
    attrs: {
      href: footerLink.href,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Support via Venmo (opens a new tab)",
    },
  }));
  if (testMode) {
    popup.appendChild(el("small", {
      className: "donation-preview-note",
      text: "Test preview: shown on every reload.",
    }));
  }
  document.body.appendChild(popup);

  let shownOnPage = false;
  let dismissed = false;
  let storageUnavailable = false;
  const consentPanel = document.getElementById("analytics-consent");

  function storageFailed(error: unknown): void {
    storageUnavailable = true;
    console.error("Unable to read or save donation milestones.", error);
    status.textContent = "Donation reminders are unavailable on this page because browser storage could not be read or saved. The footer support link still works.";
    status.hidden = false;
  }

  function update(): void {
    const blocked = document.body.classList.contains("search-open")
      || Boolean(consentPanel && !consentPanel.hidden);
    if (dismissed) return;
    if (shownOnPage) {
      popup.hidden = blocked;
      return;
    }
    if (blocked || storageUnavailable) return;
    if (testMode) {
      title.textContent = "Found this useful?";
    } else {
      const { visited, total } = overallProgress(courses);
      if (total === 0) return;
      const reached = MILESTONES.filter(milestone => visited * 100 >= milestone * total);
      try {
        const acknowledged = readMilestones();
        const next = reached.filter(milestone => !acknowledged.has(milestone)).pop();
        if (next === undefined) return;
        for (const milestone of reached) acknowledged.add(milestone);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...acknowledged]));
        title.textContent = `You've reached ${next}%`;
      } catch (error) {
        storageFailed(error);
        return;
      }
    }
    shownOnPage = true;
    popup.hidden = false;
  }

  function dismiss(): void {
    dismissed = true;
    popup.hidden = true;
  }

  close.addEventListener("click", dismiss);
  popup.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      dismiss();
    }
  });
  window.addEventListener(PROGRESS_CHANGED_EVENT, update);
  window.addEventListener("storage", update);
  const observer = new MutationObserver(update);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (consentPanel) observer.observe(consentPanel, { attributes: true, attributeFilter: ["hidden"] });
  update();
}
