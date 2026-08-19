import type { ClientMessage } from '@/lib/chat';

interface ChatViewProps {
  messages: ClientMessage[];
  streaming: boolean;
  error: string | null;
}

export function ChatView({ messages, streaming, error }: ChatViewProps) {
  return (
    <div className="chat-view" data-testid="chat-view">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`chat-bubble chat-bubble-${m.role}`}
          data-testid={`chat-message-${m.role}-${i}`}
        >
          {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
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
