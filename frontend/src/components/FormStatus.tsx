export type FormStatusState = {
  kind: "ok" | "error";
  text: string;
} | null;

// Inline save result for the data-entry forms. Rendered outside the
// collapsible <details> so it stays visible after the form closes; role=status
// makes screen readers announce it.
export function FormStatus({ status }: { status: FormStatusState }) {
  if (!status) return null;
  return (
    <p className={`form-status ${status.kind}`} role="status">
      {status.text}
    </p>
  );
}
