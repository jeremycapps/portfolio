import { type FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Linkedin, Mail, Search, Send, Sparkles, Trash2 } from 'lucide-react';
import { ChatView } from '@/components/chat-view';
import { PromptStarters } from '@/components/prompt-starters';
import { SiteHeader } from '@/components/site-header';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { ResumeSurface } from '@/components/facia/resume-surface';
import {
  AnswerApiError,
  sendStructuredAnswer,
} from '@/lib/answer';
import {
  compactMessageText,
  consumeChoices,
  markdownContent,
  messageHasVisibleContent,
  sendChat,
  type ClientMessage,
} from '@/lib/chat';
import { DEFAULT_RESUME } from '@/lib/default-resume.generated';
import { ResumeApiError, sendResumeRequest, type ResumeResponse } from '@/lib/resume';
import { EXPLAIN_PROJECT_CHOICES } from '@/lib/projects';

// Seeded questions so the "ask" is never a blank prompt — each hands the visitor
// a real question the assistant can answer, matching the surface-first idea.
const ASK_QUESTIONS: readonly { label: string; prompt: string }[] = [
  {
    label: 'What is StratOS?',
    prompt:
      'Explain the StratOS project in depth — what it is, how it works, and why it matters.',
  },
  {
    label: "What's he looking for?",
    prompt: 'What kind of roles is Jeremy looking for, and what does he most want to do?',
  },
  {
    label: 'Explain Libera',
    prompt:
      'Explain the Libera project in depth — what it is, how it works, and why it matters.',
  },
  {
    label: 'How does the work connect?',
    prompt:
      "What is the throughline of Jeremy's work across operations, engineering, and his independent projects?",
  },
];

export default function AskPage() {
  const [prompt, setPrompt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'normal' | 'error' | 'success'>('normal');
  const [toastMessage, setToastMessage] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [resumeMode, setResumeMode] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeResponse | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const hasConversation =
    messages.length > 0 || resumeResult !== null || chatError !== null;
  // A request is in flight but nothing has rendered yet — show a loader so the
  // interface never looks idle while the model is calculating.
  const awaitingAnswer =
    streaming &&
    resumeResult === null &&
    !messages.some((m) => m.role === 'assistant' && messageHasVisibleContent(m));
  const chatActive = hasConversation || awaitingAnswer;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handlePromptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      if (!streaming) {
        setStatusTone('error');
        setStatusMessage('Write a question first, then send it to Domain.');
      }
      return;
    }
    setPrompt('');
    if (resumeMode) {
      void submitResume(cleanPrompt);
      return;
    }
    void submitPrompt(cleanPrompt);
  };

  const submitPrompt = async (rawPrompt: string) => {
    const cleanPrompt = rawPrompt.trim();
    if (!cleanPrompt || streaming) return;

    setStatusMessage('');
    setChatError(null);
    setResumeMode(false);
    setResumeResult(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      // Consume any pending interactive choices so the picker stops being clickable.
      const history = messages.map(consumeChoices);
      const next: ClientMessage[] = [...history, { role: 'user', content: cleanPrompt }];
      setMessages([...next, { role: 'assistant', content: markdownContent() }]);

      try {
        const answer = await sendStructuredAnswer(
          cleanPrompt,
          'glance',
          controller.signal,
          history.map((message) => ({
            role: message.role,
            content: compactMessageText(message),
          })),
        );
        setMessages([
          ...next,
          {
            role: 'assistant',
            content: { kind: 'facia', question: cleanPrompt, answer },
          },
        ]);
        return;
      } catch (error) {
        const fallbackCodes = new Set([
          'QUESTION_NOT_MODELED',
          'MODEL_REFUSED',
          'MODEL_PROVIDER_TIMEOUT',
          'MODEL_MALFORMED_JSON',
          'MODEL_SCHEMA_INVALID',
          'MODEL_PROVIDER_UNAVAILABLE',
          'INVALID_RESPONSE',
        ]);
        if (!(error instanceof AnswerApiError) || !fallbackCodes.has(error.code)) throw error;
      }

      await sendChat(next, {
        signal: controller.signal,
        onDelta: (t) =>
          setMessages((cur) => {
            if (cur.length === 0) return cur;
            const last = cur[cur.length - 1];
            if (!last || last.role !== 'assistant' || last.content.kind !== 'markdown') return cur;
            const copy = cur.slice();
            copy[copy.length - 1] = {
              ...last,
              content: markdownContent(last.content.markdown + t),
            };
            return copy;
          }),
      });
      setMessages((cur) => {
        const last = cur[cur.length - 1];
        return last && last.role === 'assistant'
          && last.content.kind === 'markdown'
          && last.content.markdown === ''
          ? cur.slice(0, -1)
          : cur;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // reset/abort, not a real error
      setChatError(err instanceof Error ? err.message : 'Something went wrong.');
      // Drop the empty assistant placeholder on hard failure.
      setMessages((cur) => {
        const last = cur[cur.length - 1];
        return last?.role === 'assistant'
          && last.content.kind === 'markdown'
          && last.content.markdown === ''
          ? cur.slice(0, -1)
          : cur;
      });
    } finally {
      setStreaming(false);
    }
  };

  const armResume = () => {
    if (streaming) return;
    setMessages([]);
    setChatError(null);
    setResumeResult(DEFAULT_RESUME);
    setResumeMode(true);
    setStatusTone('normal');
    setStatusMessage('Showing the standard resume. Paste a job description or link to tailor it.');
  };

  const submitResume = async (jobDescription: string) => {
    if (streaming) return;
    // Resume mode stays on through tailoring so the composer keeps inviting
    // another job description; handleClearChat / other starters exit it.
    setResumeResult(null);
    setStatusMessage('');
    setChatError(null);
    setMessages([]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await sendResumeRequest(jobDescription, controller.signal);
      setResumeResult(result);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setChatError(
        error instanceof ResumeApiError
          ? error.message
          : 'The resume could not be generated.',
      );
    } finally {
      setStreaming(false);
    }
  };

  // "Explain a project" synthesizes an assistant turn whose response carries the
  // interactive picker (the Facia pattern, rendered client-side for now).
  const handleExplainProject = () => {
    if (streaming) return;
    setStatusMessage('');
    setChatError(null);
    setResumeMode(false);
    setResumeResult(null);
    setMessages((cur) => [
      ...cur.map(consumeChoices),
      { role: 'user', content: 'Can you tell me about one of your projects?' },
      {
        role: 'assistant',
        content: markdownContent('Sure — which one would you like to hear about?'),
        choices: EXPLAIN_PROJECT_CHOICES,
      },
    ]);
  };

  const handleClearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setResumeMode(false);
    setResumeResult(null);
    setChatError(null);
  };

  return (
    <main className={`app-shell${chatActive ? ' app-shell-chatting' : ''}`}>
      <SiteHeader current="ask" onNotice={showToast} />

      <section
        className={`workspace${chatActive ? ' workspace-chatting' : ''}`}
        aria-label={chatActive ? 'Portfolio assistant' : undefined}
        aria-labelledby={chatActive ? undefined : 'ask-title'}
      >
        <div className="intro home-hero">
          <p className="home-eyebrow" data-testid="text-eyebrow">Ask the assistant</p>
          <h1 className="home-thesis" id="ask-title">
            Ask anything about <span>the work.</span>
          </h1>
          <p className="home-sub">
            This assistant answers from a curated profile of Jeremy&rsquo;s projects, experience, and
            thinking. Ask a question in your own words&mdash;or start with one of these.
          </p>
        </div>

        {chatActive && (
          <div className="conversation-pane" role="region" aria-label="Conversation">
            {resumeResult ? (
              <>
                {resumeMode && (
                  <p className="resume-tailor-hint" data-testid="resume-tailor-hint">
                    Want it tailored? Paste a job description below.
                  </p>
                )}
                <ResumeSurface view={resumeResult.view} provenance={resumeResult.provenance} />
                {chatError && <div className="chat-error" role="alert" data-testid="chat-error">{chatError}</div>}
              </>
            ) : messages.length > 0 ? (
              <ChatView
                messages={messages}
                streaming={streaming}
                error={chatError}
                onChoice={(p) => void submitPrompt(p)}
              />
            ) : awaitingAnswer ? (
              <div className="loading-surface">
                <ThinkingIndicator />
              </div>
            ) : chatError ? (
              <div className="chat-error" role="alert" data-testid="chat-error">{chatError}</div>
            ) : null}
          </div>
        )}

        {!chatActive && (
          <div className="home-ask-head">
            <p className="home-ask-title">Start with a question</p>
            <p className="home-ask-note">Ask the instrument &mdash; or pick one of these.</p>
            <div className="home-question-chips" role="group" aria-label="Suggested questions">
              {ASK_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className="home-question-chip"
                  onClick={() => void submitPrompt(q.prompt)}
                  disabled={streaming}
                  data-testid={`home-question-${q.label.replace(/[^a-z]/gi, '').toLowerCase()}`}
                >
                  <span className="q" aria-hidden="true">Q</span>{q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`composer-wrap${chatActive ? ' composer-wrap-chatting' : ''}`}>
          <form className="composer" onSubmit={handlePromptSubmit} data-testid="form-prompt">
            <div className="composer-prompt">
              <Search aria-hidden="true" />
              <textarea
                className="composer-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  // Cmd+Enter (macOS) / Ctrl+Enter (Windows/Linux) sends the prompt.
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={resumeMode ? 'Paste a job description to tailor this resume…' : 'Ask anything...'}
                aria-label="Ask Domain anything"
                data-testid="input-prompt"
              />
            </div>
            <div className="composer-toolbar">
              <div className="toolbar-left" />
              <div className="toolbar-right">
                <button className="toolbar-button clear-chat-button" type="button" onClick={handleClearChat} disabled={!hasConversation && !awaitingAnswer} aria-label="Clear chat" data-testid="button-clear-chat">
                  <Trash2 aria-hidden="true" />
                  Clear chat
                </button>
                <button className="submit-button" type="submit" disabled={!prompt.trim() || streaming} aria-label="Send prompt" data-testid="button-submit-prompt">
                  <Send aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>
          <PromptStarters
            onSendPrompt={(text) => void submitPrompt(text)}
            onExplainProject={handleExplainProject}
            onArmResume={armResume}
            disabled={streaming}
          />
          <p className={`status-line ${statusTone}`} role="status" data-testid="status-prompt">{statusMessage}</p>
        </div>

        <section className="connect-section home-connect" aria-labelledby="connect-title">
          <p className="connect-label home-connect-label" id="connect-title">The context behind these answers</p>
          <div className="connection-grid home-connect-grid">
            <div className="connection-item home-connect-item">
              <span className="connection-name"><span className="source-dot is-live" aria-hidden="true" /> Profile</span>
              <span className="source-status is-live" data-testid="source-profile"><Check aria-hidden="true" /> Live</span>
            </div>
            <div className="connection-item home-connect-item">
              <span className="connection-name"><span className="source-dot" aria-hidden="true" /> GitHub</span>
              <span className="source-status" data-testid="source-github">Planned</span>
            </div>
            <div className="connection-item home-connect-item">
              <span className="connection-name"><span className="source-dot" aria-hidden="true" /> Drive</span>
              <span className="source-status" data-testid="source-drive">Planned</span>
            </div>
          </div>
          <p className="connection-note home-connect-note">
            Answers draw on a curated profile today; live repositories and documents are on the way.
          </p>
        </section>

        <div className="footer-contact" aria-label="Contact Jeremy">
          <a href="mailto:jeremy@nycwork.space" data-testid="link-email">
            <Mail aria-hidden="true" /> jeremy@nycwork.space
          </a>
          <a href="https://www.linkedin.com/in/jeremycapps" target="_blank" rel="noreferrer noopener" data-testid="link-linkedin">
            <Linkedin aria-hidden="true" /> LinkedIn
          </a>
        </div>

        <p className="footer-note"><Sparkles aria-hidden="true" /> A small surface for big thinking.</p>
      </section>

      {toastMessage && <div className="toast-message" role="status" data-testid="status-toast">{toastMessage}</div>}
    </main>
  );
}
