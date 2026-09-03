import { Briefcase, Compass, Layers, Mail, Sparkles, Target } from 'lucide-react';

const SUMMARY_PROMPT =
  "Give me a concise summary of Jeremy's experience and background — the highlights someone should know.";

const THROUGHLINE_PROMPT =
  "What's the throughline across Jeremy's work — the principle that stays constant as the tools change?";

const ROLES_PROMPT =
  'What kinds of roles fit Jeremy, and why?';

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
  const fire = (text: string) => {
    if (disabled) return;
    onSendPrompt(text);
  };

  const handleExplain = () => {
    if (disabled) return;
    onExplainProject();
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
          id="throughline"
          active={false}
          disabled={disabled}
          onClick={() => fire(THROUGHLINE_PROMPT)}
          icon={<Compass aria-hidden="true" />}
          label="What's the throughline?"
        />
        <StarterChip
          id="roles"
          active={false}
          disabled={disabled}
          onClick={() => fire(ROLES_PROMPT)}
          icon={<Target aria-hidden="true" />}
          label="What roles fit Jeremy?"
        />
        <a
          className="starter-chip"
          href="mailto:jeremy@nycwork.space"
          data-testid="link-starter-message"
        >
          <Mail aria-hidden="true" />
          <span>Send me a message</span>
        </a>
      </div>
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
