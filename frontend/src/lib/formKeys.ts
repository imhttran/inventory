import type { KeyboardEvent } from "react";

// Shared keyboard model for the data-entry forms (suppliers, products, users):
// Enter jumps to the next input/select — the last one submits the form and
// runs native validation — and Esc invokes onEscape to close/cancel. Enter on
// buttons keeps its native activate behavior; Shift+Enter and IME composition
// are left alone. An open <select> popup handles keys natively, so dropdown
// picking is unaffected.
export function formKeys(onEscape?: () => void) {
  return (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape?.();
      return;
    }
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.tagName !== "INPUT" && target.tagName !== "SELECT") return;
    const form = event.currentTarget;
    const fields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "input, select",
      ),
    );
    const next =
      fields[
        fields.indexOf(
          target as HTMLInputElement | HTMLSelectElement,
        ) + 1
      ];
    event.preventDefault();
    if (next) {
      next.focus();
      if (next instanceof HTMLInputElement) next.select();
    } else {
      form.requestSubmit();
    }
  };
}
