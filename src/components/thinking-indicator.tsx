interface ThinkingIndicatorProps {
  label?: string;
}

// Shown whenever a request is in flight but no answer has streamed in yet,
// so the interface never looks idle while the model is calculating.
export function ThinkingIndicator({ label = 'Domain is thinking…' }: ThinkingIndicatorProps) {
  return (
    <div className="thinking" role="status" aria-live="polite" data-testid="thinking-indicator">
      <span className="thinking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="thinking-label">{label}</span>
    </div>
  );
}
