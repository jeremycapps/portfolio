import { Briefcase, Mail } from 'lucide-react';

// Actions only. Questions live in the Ask page's starter list; a summary of his
// experience is what the resume already is, so it isn't a separate chip.
interface PromptStartersProps {
  onArmResume: () => void;
  disabled?: boolean;
}

export function PromptStarters({
  onArmResume,
  disabled = false,
}: PromptStartersProps) {
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
