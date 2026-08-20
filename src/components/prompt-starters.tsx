import { type FormEvent, useState } from 'react';
import { Briefcase, Check, Layers, Mail, Send, Sparkles, X } from 'lucide-react';
import { sendContactMessage } from '@/lib/contact';

const SUMMARY_PROMPT =
  "Give me a concise summary of Jeremy's experience and background — the highlights someone should know.";

interface PromptStartersProps {
  onSendPrompt: (text: string) => void;
  onExplainProject: () => void;
  onArmResume: () => void;
  disabled?: boolean;
}

export function PromptStarters({
  onSendPrompt,
  onExplainProject,
  onArmResume,
  disabled = false,
}: PromptStartersProps) {
  const [messageOpen, setMessageOpen] = useState(false);

  // Contact panel — the one starter that needs two input fields.
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [contactState, setContactState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [contactError, setContactError] = useState<string | null>(null);

  const fire = (text: string) => {
    if (disabled) return;
    setMessageOpen(false);
    onSendPrompt(text);
  };

  const handleExplain = () => {
    if (disabled) return;
    setMessageOpen(false);
    onExplainProject();
  };

  const toggleMessage = () => {
    setContactError(null);
    setMessageOpen((open) => !open);
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    const cleanEmail = email.trim();
    if (!cleanMessage || !cleanEmail || contactState === 'sending') return;
    setContactState('sending');
    setContactError(null);
    try {
      await sendContactMessage({ message: cleanMessage, email: cleanEmail });
      setContactState('sent');
      setMessage('');
      setEmail('');
    } catch (error) {
      setContactState('idle');
      setContactError(error instanceof Error ? error.message : 'Your message could not be sent.');
    }
  };

  return (
    <div className="prompt-starters" data-testid="prompt-starters">
      <div className="starter-chips" role="group" aria-label="Prompt starters">
        <StarterChip
          id="resume"
          active={false}
          disabled={disabled}
          onClick={onArmResume}
          icon={<Briefcase aria-hidden="true" />}
          label="Generate a resume"
        />
        <StarterChip
          id="summary"
          active={false}
          disabled={disabled}
          onClick={() => fire(SUMMARY_PROMPT)}
          icon={<Sparkles aria-hidden="true" />}
          label="Summarize my experience"
        />
        <StarterChip
          id="project"
          active={false}
          disabled={disabled}
          onClick={handleExplain}
          icon={<Layers aria-hidden="true" />}
          label="Explain a project"
        />
        <StarterChip
          id="message"
          active={messageOpen}
          disabled={false}
          onClick={toggleMessage}
          icon={<Mail aria-hidden="true" />}
          label="Send me a message"
        />
      </div>

      {messageOpen && (
        <form className="starter-panel" onSubmit={handleContactSubmit} data-testid="starter-panel-message">
          <div className="starter-panel-head">
            <span className="starter-panel-title"><Mail aria-hidden="true" /> Send Jeremy a message</span>
            <button className="starter-close" type="button" onClick={() => setMessageOpen(false)} aria-label="Close">
              <X aria-hidden="true" />
            </button>
          </div>
          {contactState === 'sent' ? (
            <p className="starter-sent" data-testid="text-contact-sent">
              <Check aria-hidden="true" /> Thanks — your message is on its way.
            </p>
          ) : (
            <>
              <textarea
                className="starter-field"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What would you like to say?"
                aria-label="Your message"
                data-testid="input-contact-message"
                autoFocus
              />
              <input
                className="starter-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email, so Jeremy can reply"
                aria-label="Your email"
                data-testid="input-contact-email"
                required
              />
              {contactError && (
                <p className="starter-error" role="alert" data-testid="text-contact-error">{contactError}</p>
              )}
              <div className="starter-panel-foot">
                <button
                  className="starter-submit"
                  type="submit"
                  disabled={!message.trim() || !email.trim() || contactState === 'sending'}
                  data-testid="button-contact-send"
                >
                  <Send aria-hidden="true" /> {contactState === 'sending' ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}

interface StarterChipProps {
  id: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function StarterChip({ id, active, disabled, onClick, icon, label }: StarterChipProps) {
  return (
    <button
      className={`starter-chip${active ? ' is-active' : ''}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      data-testid={`button-starter-${id}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
