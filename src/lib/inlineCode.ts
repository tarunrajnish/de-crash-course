const BACKTICK_SPAN = /`([^`]+)`/g;

type TextRenderer = (target: HTMLElement, text: string, wholeTermOnly?: boolean) => void;

const appendText: TextRenderer = (target, text) => {
  target.appendChild(document.createTextNode(text));
};

export function renderInlineText(target: HTMLElement, text: string, renderText: TextRenderer = appendText): void {
  BACKTICK_SPAN.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = BACKTICK_SPAN.exec(text)) !== null) {
    found = true;
    if (match.index > lastIndex) {
      renderText(target, text.slice(lastIndex, match.index));
    }
    const value = match[1];
    const chip = document.createElement("span");
    chip.className = "inline-code";
    const code = document.createElement("code");
    renderText(code, value, true);
    chip.appendChild(code);
    target.appendChild(chip);
    lastIndex = BACKTICK_SPAN.lastIndex;
  }

  if (!found) {
    renderText(target, text);
    return;
  }

  if (lastIndex < text.length) {
    renderText(target, text.slice(lastIndex));
  }
}
