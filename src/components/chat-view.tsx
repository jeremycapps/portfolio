import { useEffect, useRef } from 'react';
import type { ClientMessage } from '../lib/chat';
import { ConversationAnswer } from './facia/conversation-answer';
import { MarkdownContent } from './markdown-content';
import { ThinkingIndicator } from './thinking-indicator';

interface ChatViewProps {
  messages: ClientMessage[];
  streaming: boolean;
  error: string | null;
  onChoice?: (prompt: string) => void;
}

export function ChatView({ messages, streaming, error, onChoice }: ChatViewProps) {
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tailRef.current?.scrollIntoView({
      block: 'end',
      behavior: streaming ? 'auto' : 'smooth',
    });
  }, [messages, streaming, error]);

  return (
    <div className="chat-view" data-testid="chat-view">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`chat-bubble chat-bubble-${m.role}${
            m.role === 'assistant' && m.content.kind === 'facia' ? ' chat-bubble-facia' : ''
          }`}
          data-testid={`chat-message-${m.role}-${i}`}
        >
          {m.role === 'user' ? m.content : m.content.kind === 'facia' ? (
            <ConversationAnswer
              recipe={m.content.answer.recipe}
              recipesByDepth={m.content.answer.recipesByDepth}
            />
          ) : m.content.markdown ? (
            <MarkdownContent content={m.content.markdown} />
          ) : streaming && i === messages.length - 1 ? (
            <ThinkingIndicator />
          ) : null}
          {m.role === 'assistant' && m.choices && m.choices.length > 0 && (
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
      <div className="chat-tail" ref={tailRef} aria-hidden="true" />
    </div>
  );
}
