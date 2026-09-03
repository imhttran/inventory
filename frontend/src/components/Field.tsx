import type { ReactNode } from "react";

// Labeled cell for the shared data-entry grid (.field-grid). Wrapping the
// control in the <label> keeps the text clickable and gives screen readers a
// proper field name — unlike placeholder-only inputs.
export function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: 2 | 4;
  children: ReactNode;
}) {
  return (
    <label className={span ? `field span-${span}` : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}
