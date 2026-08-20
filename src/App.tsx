import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Linkedin, Mail, Menu, Mic, Search, Send, Sparkles, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChatView } from '@/components/chat-view';
import { PromptStarters } from '@/components/prompt-starters';
import { ResumeSurface } from '@/components/facia/resume-surface';
import { SemanticSurface } from '@/components/facia/semantic-surface';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  AnswerApiError,
  sendStructuredAnswer,
  type StructuredAnswerResponse,
} from '@/lib/answer';
import { sendChat, type ClientMessage, type MessageChoice } from '@/lib/chat';
import { ResumeApiError, sendResumeRequest, type ResumeResponse } from '@/lib/resume';
import type { DisclosureDepth } from '@facia/core';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const HERO_PHRASES = ['my experience', 'my projects', 'anything'];

const projectPrompt = (project: string) =>
  `Explain the ${project} project in depth — what it is, how it works, and why it matters.`;

const PROJECT_CHOICES: MessageChoice[] = [
  { label: 'Libera', prompt: projectPrompt('Libera') },
  { label: 'Facia', prompt: projectPrompt('Facia') },
  { label: 'Domain & Corus', prompt: projectPrompt('Domain & Corus') },
];

function RotatingPhrase() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_PHRASES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <em className="hero-rotator" key={index}>
      {HERO_PHRASES[index]}.
    </em>
  );
}

function Home() {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'normal' | 'error' | 'success'>('normal');
  const [toastMessage, setToastMessage] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [structuredAnswer, setStructuredAnswer] = useState<StructuredAnswerResponse | null>(null);
  const [structuredQuestion, setStructuredQuestion] = useState('');
  const [resumeMode, setResumeMode] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeResponse | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const hasConversation =
    messages.length > 0 || structuredAnswer !== null || resumeResult !== null || chatError !== null;
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
      if (messages.length === 0) {
        try {
          const answer = await sendStructuredAnswer(cleanPrompt, 'glance', controller.signal);
          setStructuredQuestion(cleanPrompt);
          setStructuredAnswer(answer);
          setMessages([]);
          return;
        } catch (error) {
          if (!(error instanceof AnswerApiError) || error.code !== 'QUESTION_NOT_MODELED') {
            throw error;
          }
        }
      }

      setStructuredAnswer(null);
      setStructuredQuestion('');
      // Consume any pending interactive choices so the picker stops being clickable.
      const history = messages.map((m) => (m.choices ? { role: m.role, content: m.content } : m));
      const next: ClientMessage[] = [...history, { role: 'user', content: cleanPrompt }];
      // Add an empty assistant message only after the deterministic route declines the question.
      setMessages([...next, { role: 'assistant', content: '' }]);
      await sendChat(next, {
        signal: controller.signal,
        onDelta: (t) =>
          setMessages((cur) => {
            if (cur.length === 0) return cur;
            const last = cur[cur.length - 1];
            if (!last || last.role !== 'assistant') return cur;
            const copy = cur.slice();
            copy[copy.length - 1] = { ...last, content: last.content + t };
            return copy;
          }),
      });
      setMessages((cur) => {
        const last = cur[cur.length - 1];
        return last && last.role === 'assistant' && last.content === '' ? cur.slice(0, -1) : cur;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // reset/abort, not a real error
      setChatError(err instanceof Error ? err.message : 'Something went wrong.');
      // Drop the empty assistant placeholder on hard failure.
      setMessages((cur) =>
        cur[cur.length - 1]?.content === '' ? cur.slice(0, -1) : cur,
      );
    } finally {
      setStreaming(false);
    }
  };

  const armResume = () => {
    if (streaming) return;
    setResumeMode(true);
    setStatusTone('normal');
    setStatusMessage('Paste the job description or a link, then send.');
  };

  const submitResume = async (jobDescription: string) => {
    if (streaming) return;
    setResumeMode(false);
    setResumeResult(null);
    setStatusMessage('');
    setChatError(null);
    setStructuredAnswer(null);
    setStructuredQuestion('');
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
    setStructuredAnswer(null);
    setStructuredQuestion('');
    setMessages((cur) => [
      ...cur.map((m) => (m.choices ? { role: m.role, content: m.content } : m)),
      { role: 'user', content: 'Can you tell me about one of your projects?' },
      {
        role: 'assistant',
        content: 'Sure — which one would you like to hear about?',
        choices: PROJECT_CHOICES,
      },
    ]);
  };

  const handleDepthChange = async (depth: DisclosureDepth) => {
    if (!structuredQuestion) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    try {
      const answer = await sendStructuredAnswer(structuredQuestion, depth, controller.signal);
      setStructuredAnswer(answer);
      setChatError(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setChatError(error instanceof Error ? error.message : 'Could not change disclosure depth.');
    } finally {
      setStreaming(false);
    }
  };

  const handleMicrophone = () => {
    setIsListening(true);
    setStatusTone('normal');
    setStatusMessage('Listening for your next thought…');
    showToast('Microphone ready. Voice capture is represented in this prototype.');
    window.setTimeout(() => {
      setIsListening(false);
      setStatusMessage('');
    }, 1900);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-brand">
          <span className="brand-mark" aria-hidden="true">
            <Sparkles />
          </span>
          <span data-testid="text-brand-name">Domain</span>
        </a>

        <nav className="nav-actions" aria-label="Main navigation">
          <button className="nav-link" type="button" onClick={() => showToast('A quieter way to work with your context.')} data-testid="button-about">
            About
          </button>
          <button className="nav-link" type="button" onClick={() => showToast('This portfolio is a live interface study.')} data-testid="button-journal">
            Journal
          </button>
          <button className="avatar-button" type="button" onClick={() => showToast("This is Jeremy's portfolio — ask the assistant about his work.")} aria-label="Open profile" data-testid="button-profile">
            JC
          </button>
        </nav>

        <button className="mobile-menu" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)} data-testid="button-mobile-menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {menuOpen && (
        <div className="mobile-nav" data-testid="menu-mobile">
          <button type="button" onClick={() => showToast('A quieter way to work with your context.')} data-testid="button-mobile-about">About</button>
          <button type="button" onClick={() => showToast('This portfolio is a live interface study.')} data-testid="button-mobile-journal">Journal</button>
          <button type="button" onClick={() => showToast('Profile settings are coming with your workspace.')} data-testid="button-mobile-profile">Profile</button>
        </div>
      )}

      <section className="workspace" aria-labelledby="hero-title">
        <div className="intro">
          <p className="eyebrow" data-testid="text-eyebrow">The portfolio of Jeremy Capps</p>
          <h1 className="hero-title" id="hero-title">
            Ask me about<br />
            <RotatingPhrase />
          </h1>
          <p className="hero-description">
            A conversational portfolio. Ask about my experience, the systems I'm building, or how I think about software — and get a straight answer.
          </p>
        </div>

        {hasConversation && (
          <>
            <button
              className="chat-reset"
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                setMessages([]);
                setStructuredAnswer(null);
                setStructuredQuestion('');
                setResumeMode(false);
                setResumeResult(null);
                setChatError(null);
              }}
              data-testid="button-new-chat"
            >
              New chat
            </button>
            {resumeResult ? (
              <>
                <ResumeSurface view={resumeResult.view} provenance={resumeResult.provenance} />
                {chatError && <div className="chat-error" role="alert" data-testid="chat-error">{chatError}</div>}
              </>
            ) : structuredAnswer ? (
              <>
                <SemanticSurface recipe={structuredAnswer.recipe} onDepthChange={handleDepthChange} />
                {chatError && <div className="chat-error" role="alert" data-testid="chat-error">{chatError}</div>}
              </>
            ) : (
              <ChatView messages={messages} streaming={streaming} error={chatError} onChoice={(p) => void submitPrompt(p)} />
            )}
          </>
        )}

        <div className="composer-wrap">
          <form className="composer" onSubmit={handlePromptSubmit} data-testid="form-prompt">
            <div className="composer-prompt">
              <Search aria-hidden="true" />
              <textarea
                className="composer-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={resumeMode ? 'Paste the job description or a link…' : 'Ask anything...'}
                aria-label="Ask Domain anything"
                data-testid="input-prompt"
              />
            </div>
            <div className="composer-toolbar">
              <div className="toolbar-left" />
              <div className="toolbar-right">
                <button className={`toolbar-button microphone-button${isListening ? ' is-listening' : ''}`} type="button" onClick={handleMicrophone} aria-label={isListening ? 'Listening' : 'Use microphone'} data-testid="button-microphone">
                  <Mic aria-hidden="true" />
                </button>
                <button className="submit-button" type="submit" disabled={!prompt.trim() || streaming} aria-label="Send prompt" data-testid="button-submit-prompt">
                  <ArrowUpIcon />
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

        <section className="connect-section" aria-labelledby="connect-title">
          <p className="connect-label" id="connect-title">The context behind these answers.</p>
          <div className="connection-grid">
            <div className="connection-item">
              <span className="connection-name"><span className="source-dot is-live" aria-hidden="true" /> Profile</span>
              <span className="source-status is-live" data-testid="source-profile"><Check aria-hidden="true" /> Live</span>
            </div>
            <div className="connection-item">
              <span className="connection-name"><span className="source-dot" aria-hidden="true" /> GitHub</span>
              <span className="source-status" data-testid="source-github">Planned</span>
            </div>
            <div className="connection-item">
              <span className="connection-name"><span className="source-dot" aria-hidden="true" /> Drive</span>
              <span className="source-status" data-testid="source-drive">Planned</span>
            </div>
          </div>
          <p className="connection-note">
            Answers draw on a curated profile today; live repositories and documents are on the way.
          </p>
        </section>

        <section className="portfolio" aria-labelledby="portfolio-title">
          <div className="portfolio-header">
            <div>
              <p className="portfolio-kicker">Selected work / 03</p>
              <h2 className="portfolio-title" id="portfolio-title">What I'm building.</h2>
            </div>
            <button className="portfolio-link" type="button" onClick={() => showToast('Ask the assistant about any of these — it knows the details.')} data-testid="button-view-archive">
              Ask about my work <ChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="document-grid">
            <button className="document-card" type="button" onClick={() => showToast('Libera — a page-based platform for executable semantic models.')} data-testid="card-libera">
              <div className="document-topline"><span>Semantic runtime</span><span>01 / 03</span></div>
              <div className="document-body">
                <h3>Libera</h3>
                <div className="document-rule" />
                <p className="document-copy">A page-based platform for composing and deploying executable semantic models — Notion + Obsidian + Vercel for meaning.</p>
                <div className="document-chart" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              </div>
            </button>

            <button className="document-card" type="button" onClick={() => showToast('Facia — the question-to-interface contract powering this page.')} data-testid="card-facia">
              <div className="document-topline"><span>Interface runtime</span><span>02 / 03</span></div>
              <div className="document-body">
                <h3>Facia</h3>
                <div className="document-rule" />
                <p className="document-copy">The question-to-interface contract: it turns an answered model into a rendered surface — and powers the structured answers on this very page.</p>
                <div className="document-chart" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              </div>
            </button>

            <button className="document-card" type="button" onClick={() => showToast('Domain & Corus — source-bound, replayable context for agent workflows.')} data-testid="card-domain-corus">
              <div className="document-topline"><span>Context infrastructure</span><span>03 / 03</span></div>
              <div className="document-body">
                <h3>Domain &amp; Corus</h3>
                <div className="document-rule" />
                <p className="document-copy">Source-bound, replayable context for agentic workflows: evidence, verdicts, and an audit trail that can rebuild settled state.</p>
                <div className="document-chart" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              </div>
            </button>
          </div>
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

function ArrowUpIcon() {
  return <Send aria-hidden="true" />;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
