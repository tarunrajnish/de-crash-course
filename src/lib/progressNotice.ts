import { el } from "./dom";
export function addProgressNotice(host: HTMLElement): void {
  host.classList.add("progress-notice-host");
  host.appendChild(el("small", {
    className: "progress-notice",
    text: "Clearing site data resets progress.",
  }));
}
