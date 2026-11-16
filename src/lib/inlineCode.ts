// Parses backtick-wrapped spans in plain prose (e.g. `spark.sql.shuffle.partitions`)
// into styled inline code chips with a copy-to-clipboard button, without requiring
// a markdown library or a change to the content data model.
import { icon } from "./icons";

const BACKTICK_SPAN = /`([^`]+)`/g;

function copyButton(value: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "inline-code-copy";
  button.setAttribute("aria-label", `Copy "${value}"`);
  const copyIcon = icon("copy", "inline-code-copy-icon");
  button.appendChild(copyIcon);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard?.writeText(value).then(() => {
      button.classList.add("inline-code-copy--done");
      button.replaceChildren(icon("check", "inline-code-copy-icon"));
      window.setTimeout(() => {
        button.classList.remove("inline-code-copy--done");
        button.replaceChildren(icon("copy", "inline-code-copy-icon"));
      }, 1200);
    });
  });

  return button;
}

export function renderInlineText(target: HTMLElement, text: string): void {
  BACKTICK_SPAN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = BACKTICK_SPAN.exec(text)) !== null) {
    found = true;
    if (match.index > lastIndex) {
      target.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const value = match[1];
    const chip = document.createElement("span");
    chip.className = "inline-code";
    const code = document.createElement("code");
    code.textContent = value;
    chip.appendChild(code);
    chip.appendChild(copyButton(value));
    target.appendChild(chip);
    lastIndex = BACKTICK_SPAN.lastIndex;
  }

  if (!found) {
    target.textContent = text;
    return;
  }

  if (lastIndex < text.length) {
    target.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}
