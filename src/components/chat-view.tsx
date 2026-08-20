import type { ClientMessage } from '@/lib/chat';

interface ChatViewProps {
  messages: ClientMessage[];
  streaming: boolean;
  error: string | null;
  onChoice?: (prompt: string) => void;
}

export function ChatView({ messages, streaming, error, onChoice }: ChatViewProps) {
  return (
    <div className="chat-view" data-testid="chat-view">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`chat-bubble chat-bubble-${m.role}`}
          data-testid={`chat-message-${m.role}-${i}`}
        >
          {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
          {m.choices && m.choices.length > 0 && (
            <div className="chat-choices" role="group" aria-label="Choose an option">
              {m.choices.map((choice) => (
                <button
                  className="starter-choice"
                  type="button"
                  key={choice.label}
                  onClick={() => onChoice?.(choice.prompt)}
                  disabled={streaming || !onChoice}
                  data-testid={`button-choice-${choice.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {error && (
        <div className="chat-error" role="alert" data-testid="chat-error">
          {error}
        </div>
      )}
    </div>
  );
}
